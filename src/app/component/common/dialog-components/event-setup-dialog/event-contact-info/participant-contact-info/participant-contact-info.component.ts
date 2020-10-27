import { Component, Input, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef
	   } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { ContactInfoField, ContactInfoField2, SecondaryInfoField } from '@app/models';
import { ParticipantContactInfoForm } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info.form';
import { ParticipantContactInfoFieldsComponent } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info-fields/participant-contact-info-fields.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

export { ParticipantContactInfoForm, ContactInfoFieldForm } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info.form';

@Component({
	selector: 'participant-contact-info',
	templateUrl: './participant-contact-info.component.html',
	styleUrls: ['./participant-contact-info.component.css'],
	providers: [WindowService]
})
export class ParticipantContactInfoComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() name: string;
	@Input() form: ParticipantContactInfoForm;

	get fields(): ContactInfoField[] {
		const fields: ContactInfoField[] = [];
		return fields.concat(this.form.value.hasDefaultFields)
			.concat(this.form.value.defaultFields)
			.concat(this.form.value.customFields)
			.filter(x => x.choose);
	}

	private _subs: Rx.Subscription[] = [];

	constructor(
		private _windowService: WindowService,
		private _changeDetector: ChangeDetectorRef
	) {}

	ngOnInit() {
		this._subs = [
			this.form.valueChanges.subscribe((x) => {
				this._changeDetector.detectChanges();
			})
		];
	}

	ngAfterViewInit() {
	}

	showWindow() {
		const _window = this._windowService.create<ParticipantContactInfoFieldsComponent>(
			ParticipantContactInfoFieldsComponent,
			{ width: 400 }
		)
		.changeInputs((component, w) => {
			component.form = this.form;
			component.close.subscribe(() => {
				w.close();
				w.destroy();
			});
		});

		_window.open();
	}

	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}
