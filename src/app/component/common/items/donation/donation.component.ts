import {
	Component, Input, ElementRef, OnInit, OnDestroy, Output, EventEmitter,
	SimpleChanges, ViewChild, AfterViewInit, ChangeDetectorRef, ViewChildren,
	QueryList, Renderer
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UploadFile, UploadEvent } from 'ngx-file-drop';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { TextEditorTinyMceDirective } from '@app-directives/text-editor-tinymce/text-editor-tinymce.directive';
import { Box } from '@app-lib/rect/rect';
import { FundraisingInfo, FundraisingLevelInfo, ContactInfo, ContactFieldInfo, SecondFieldInfo, FrequencyTypes } from '@app/models';
import { Item, CommonItemContent } from '@app/models';
import {
	CommentDialogComponent, CommentForm, CommentInfo, newCommentForm, createCommentWindow
} from '@app-items/donation/comment-dialog/comment-dialog.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { UUID } from '@app-lib/uuid/uuid.service';



@Component({
	moduleId: module.id,
	selector: 'donation-item',
	templateUrl: 'donation.component.html',
	styleUrls: [
		'donation.component.css'
	]
})

export class DonationComponent implements OnInit, OnDestroy, AfterViewInit {	
	@Input() item: Item;
	@Input() editable: boolean=true;	
	@Output() itemChange = new EventEmitter<Item>();	

	@ViewChild('reviewContainer') reviewContainer: ElementRef;

	public itemContent: CommonItemContent<FundraisingInfo>;
	public fundraisingInfo: FundraisingInfo;
	private commentWindow: DialogWindow<CommentDialogComponent>;

	commentForm: CommentForm;

	_frequencyTypes = FrequencyTypes;

	donationLevel: FormControl = new FormControl('0');
	otherDonationLevel: FormControl =  new FormControl('');
	donationFrequency: FormControl =  new FormControl('');

	_dedicationTypes: any = [
		{ type: 'behalf', disp: 'on behalf of', checked: false },
		{ type: 'honor', disp: 'in honor of', checked: false },
		{ type: 'memory', disp: 'in memory of', checked: false }
	];

	private _subs: Rx.Subscription[]=[];

	constructor(
		private windowService: WindowService,
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private renderer: Renderer
	) {	}

	ngOnInit() {		
		this.itemContent = this.item.content as CommonItemContent<FundraisingInfo>;
		this.fundraisingInfo = this.itemContent.info.value;		
		
		// this.radioSelect(this.fundraisingInfo.dedicationInfo.type);		

		this.commentForm = newCommentForm(new CommentInfo('', '', false));
		this.fundraisingInfo.fundraisingFrequencyType
		this._subs = [

			this.commentForm.valueChanges.subscribe((x) => {
				this.changeDetector.detectChanges();
			}),

			this.commentForm.controls.comment.valueChanges.subscribe(x => {
				this.commentForm.controls.comment.setValue(
					x,
					{ onlySelf: true, emitEvent: false, emitModelToViewChange: true }
				);
			}),

			this.otherDonationLevel.valueChanges.subscribe(r=> {
				this.donationLevel.setValue(r);
			})

		];
	}

	ngAfterViewInit() {
		this.commentWindow = createCommentWindow(this.windowService, this.commentForm);
		setTimeout(() => {
			const height = this.item.content.box.height();
			const eleHeight = (this.reviewContainer.nativeElement as HTMLElement).offsetHeight + 50;		
			if (height != eleHeight)
				this.itemChange.emit(this.item.setContent(this.itemContent.setBox(this.itemContent.box.setBottom(this.itemContent.box.top + eleHeight))));  
		});
	}

	ngOnDestroy() {
		this.commentWindow.destroy();
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}		
	}

	onClickDonationLevel(amount: number) {
		this.donationLevel.setValue(amount);		
	}

	onFocusOtherDonationLevel() {
		this.donationLevel.setValue(this.otherDonationLevel.value);
	}

	onClickFrequency(t: string) {
		this.donationFrequency.setValue(t);
	}

	showCommentWindow() {
		this.commentWindow.open();
	}

	radioSelect(type: string) {
		// this.types.map((item: any) => {
		// 	if (item.type == type) {
		// 		item.checked = true;
		// 	}
		// 	else {
		// 		item.checked = null;
		// 	}
		// });
	}

	commentView() {
		this.commentForm.controls.disp.setValue(!this.commentForm.value.disp, {});
	}

	changeSelected(event: any) {
	}

	get fields(): ContactFieldInfo[] {

		let fields = this.fundraisingInfo.contactInfo.defaultFields
			.concat(this.fundraisingInfo.contactInfo.customFields)			
			.filter((x: any) => x.isSelected);

		let result: any[] = [];

		for (let i = 0; i < fields.length; i++) {
			if (fields[i].fields.length>0) {
				result = result.concat(fields[i].fields);
			}
			else {
				result = result.concat(fields[i]);
			}
		}
		return result;
	}

	get fundraisingLevels() {
		let levels = [];
		this.fundraisingInfo.fundraisingLevels.map(level => {
			levels.push({isActive: level.isActive, amount: this.transform(level.amount), name: level.name})
		});		
		return levels;
	}

	transform(value: number): string {
		let [integer, fraction = ""] = (value || "").toString().split('.');
		fraction = parseInt(fraction, 10) > 0 ? fraction : '';
		integer = Number(integer) > 0 ? integer : '';
		if (fraction != '')
			integer = integer + '.';
		return (integer + fraction);
	}
	
	onSubmit() {		
	}
}
