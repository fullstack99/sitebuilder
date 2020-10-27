import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ElementRef,
		 ChangeDetectorRef
	   } from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { ParticipantContactInfoForm, ContactInfoFieldForm, SecondaryInfoFieldForm
	   } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info.form';
import { ContactInfoField, ContactInfoField2, SecondaryInfoField } from '@app/models';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	templateUrl: 'participant-contact-info-fields.component.html',
	styleUrls: ['participant-contact-info-fields.component.css',
	]
})
export class ParticipantContactInfoFieldsComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() form: ParticipantContactInfoForm;
	@Output() close = new EventEmitter<void>();
	secondaryForm: SecondaryInfoFieldForm;

	private _formChangesSub: Rx.Subscription;

	constructor(
		private _changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private _windowService: WindowService
	) { }

	ngOnInit() {
		this._formChangesSub = this.form.valueChanges.subscribe((x) => {
			this._changeDetector.detectChanges();
		});
	}

	ngAfterViewInit() {
		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = '50px';
	}

	onClose() {
		this.close.emit(undefined);
	}

	openFeedbackDialog() {
		let _window = createFeedbackDialogWindow(this._windowService, "e.cos.100");
		_window.open();
	}

	addField() {
		this.form.controls.customFields.push(
			new ContactInfoFieldForm(ContactInfoField.empty())
		);
	}

	ngOnDestroy() {
		this._formChangesSub.unsubscribe();
	}
}
