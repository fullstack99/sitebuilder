import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChild, ElementRef, HostListener, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { Contact } from '@app-models/email-list';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';


/** */
export function createContactDetailsWindow(
	windowService: WindowService,
	contactDetails: Contact,
	emailList: Array<string>,
	checkedEmailList: Array<string> = []
): DialogWindow<ContactDetailsComponent> {
	return windowService.create<ContactDetailsComponent>(
		ContactDetailsComponent,
		{
			width: 500,
			position: {
				left: 'calc(50% - 250px)',
				top: 'calc(10%)'
			},
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.emailList = emailList;
		comp.checkedEmailList = checkedEmailList;
		comp.contactDetails = contactDetails;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'contact-details.component.html',
	styleUrls: ['contact-details.component.css']
})
export class ContactDetailsComponent implements OnInit, OnDestroy {
	@Input() emailList: Array<string> = [];
	@Input() checkedEmailList: Array<string> = [];
	@Input() contactDetails: Contact;

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<any>();

	showAddList = new FormControl(false);
	isValid = new FormControl(false);

	newContactDetails: Contact;
	newEmailList: Array<string> = [];
		
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService
	) { }

	ngOnInit() {		
		this.newContactDetails = lodash.clone(this.contactDetails);
		this.newEmailList = lodash.clone(this.emailList);
		this.subs = [
			Rx.Observable.merge(
				this.showAddList.valueChanges,
				this.isValid.valueChanges
			).subscribe(() => this.changeDetector.detectChanges())
		];
	}	

	onInput(event: any, str: string) {
		this.newContactDetails[str] = event.srcElement['value'];		
		this.validate();
	}  

	onList(event: any) {		
		this.newEmailList = event.list;
		this.validate();
	}

	validate() {		
		if (!lodash.isEqual(this.newContactDetails, this.contactDetails) || this.newEmailList.length > 0)
			this.isValid.setValue(true);
		else
			this.isValid.setValue(false);	   
	}

	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, '');
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		this.submit.emit({
			details: this.newContactDetails,
			list: this.newEmailList
		});
	}	

	ngOnDestroy() {		
		this.subs.forEach(s => s.unsubscribe());
	}
}
