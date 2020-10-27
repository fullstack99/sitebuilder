
import { Component, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild, EventEmitter, ElementRef } from '@angular/core';
import { FormGroup, AbstractControl, FormControl, FormBuilder, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { get as _get } from 'lodash';

import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { Item, ItemContent, CommonItemContent, FormItemContent, FormInfo, SingleTextInfo, ButtonInfo, Link } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { UUID } from '@app-lib/uuid/uuid.service';
 
export function createSimpleFormDialogWindow(
	windowService: WindowService,
	itemContent: ItemContent
): DialogWindow<SimpleFormDialogComponent> {
	return windowService.create<SimpleFormDialogComponent>(
		SimpleFormDialogComponent,
		{
			width: 350,
			position: {
				left: 'calc(50% - 150px)',
				top: '50px'
			},
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = itemContent as FormItemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	selector: 'app-simple-form',
	templateUrl: './simple-form.component.html',
	styleUrls: ['./simple-form.component.css']
})
export class SimpleFormDialogComponent implements OnInit, OnDestroy {
	@Input() itemContent: FormItemContent;
	@Output() submit = new EventEmitter<FormItemContent>();
	@Output() close = new EventEmitter<void>();

	buttonItem: Item = new Item(0, 0, '', 'ButtonItem', 
								new CommonItemContent<ButtonInfo>(
									Maybe.just<ButtonInfo>(
										new ButtonInfo(
											'<p style="margin: auto; font-size: 10pt; color: #8c8c8c"><span style="font-size: 10pt; font-family: Arial; color: #8c8c8c;">Submit</span></p>',
											0, 'white', '#8c8c8c', 'white', 12, 7, 100, 30, 10, 3, 1, 0.5, 1)),
									new Box(0, 120, 0, 35),
									0,
									null,
									null,
									null
								));

	formContents: FormItemContent[] = [
		new FormItemContent(new Box(0, 210, 0, 100), [
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Name')), new Box(0, 200, 0, 34))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Email')), new Box(0, 200, 40, 74))),
				this.buttonItem.setUID(UUID.UUID()).setContent(this.buttonItem.content.setBox(this.buttonItem.content.box.moveBy(40, 90)))
			],
			new Maybe(new FormInfo(''))),

		new FormItemContent(new Box(0, 210, 0, 300),[
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Name')), new Box(0, 200, 0, 34))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Address1')), new Box(0, 200, 40, 74))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Address2')), new Box(0, 200, 80, 114))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'City')), new Box(0, 200, 120, 154))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'State')), new Box(0, 200, 160, 194))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Zip Code')), new Box(0, 200, 200, 234))),
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(1,'','',false,'Country')), new Box(0, 200, 240, 274))),
				this.buttonItem.setUID(UUID.UUID()).setContent(this.buttonItem.content.setBox(this.buttonItem.content.box.moveBy(40, 290)))
			],
			new Maybe(new FormInfo(''))),

		new FormItemContent(new Box(0, 300, 0, 165),[
				new Item(0, 0, UUID.UUID(), 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(3,'<p><span style="font-size: 14px;">Comment</span></p>','',false,'Comment')), new Box(0, 300, 0, 114))),
				this.buttonItem.setUID(UUID.UUID()).setContent(this.buttonItem.content.setBox(this.buttonItem.content.box.moveBy(90, 130)))
			],
			new Maybe(new FormInfo('')))
	];

	selectedForm: FormControl = new FormControl(0);
	formName: FormControl = new FormControl('');

	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private windowService: WindowService
	) {
	}

	ngOnInit() {
		this.subs = [
			this.selectedForm.valueChanges.subscribe(() => {
				this.changeDetector.detectChanges();
			}),
			this.formName.valueChanges.subscribe(() => {
				this.changeDetector.detectChanges();
			})
		];

		const itemLength = _get(this.itemContent, 'items.length') || 0;
		if (itemLength > 1) {
			const i = itemLength == 3 ? 0 : itemLength > 3 ? 1 : 2;
			this.formContents.splice(i, 1, this.itemContent);
			this.selectedForm.setValue(i + 1);
		}
		this.formName.setValue(_get(this.itemContent, 'info.value.formName') || '');
	}

	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');
		feedbackWindow.open();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit(e: MouseEvent) {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}

		const formContent = this.formContents[this.selectedForm.value - 1];
		formContent.info.value.formName = this.formName.value;
		formContent.info.value.formType = 'S';
		formContent.box = formContent.box.moveTo(this.itemContent.box.left, this.itemContent.box.top);
		this.submit.emit(this.formContents[this.selectedForm.value - 1]);
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}

}
