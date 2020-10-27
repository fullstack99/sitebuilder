import { Component, Input, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { EventAdmission } from '@app/models';;
import { EventMessageComponent, EventMessageForm, newEventMessageForm, createEventMessageWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { EventFeeComponent, EventFeeForm, newEventFeeForm, createEventFeeWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-fee-early-bird/event-fee-early-bird.component';
import { createQualifyParticipantDialogWindow } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/**
 * Form type for `EventAdmission`.
 */
export interface EventAdmissionForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		message: EventMessageForm;
		fee: any;
		participantsLimit: FormControl;
		guests: FormControl;
	};
}

/**
 * Create new `EventAdmissionForm` from `EventAdmission`.
 */
export function newEventAdmissionForm(v: EventAdmission): EventAdmissionForm {
	return <EventAdmissionForm>new FormGroup({
		message: newEventMessageForm(v.message),
		fee: newEventFeeForm(v.fee),
		participantsLimit: new FormControl(v.participantsLimit),
		guests: new FormControl(v.guests),
	});
}

@Component({
	selector: 'event-admission',
	templateUrl: './event-admission.component.html',
	styleUrls: ['./event-admission.component.css'],
	providers: []
})
export class EventAdmissionComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input('form') form: EventAdmissionForm;

	private _messageWindow: DialogWindow<EventMessageComponent>;
	private _priceWindow: DialogWindow<EventFeeComponent>;

	private _subs: Rx.Subscription[] = [];

	constructor(
		private _windowService: WindowService,
		private _changeDetector: ChangeDetectorRef) {}

	ngOnInit() {
		this._subs=[
			this.form.valueChanges.subscribe(result => {
				this._changeDetector.detectChanges();
			})
		];
	}

	ngAfterViewInit () {
		this._messageWindow = createEventMessageWindow(
			this._windowService, this.form.controls.message);

		this._priceWindow = createEventFeeWindow(
			this._windowService, this.form.controls.fee);
		setInterval(() => this.timetrack(), 1000);
	}

	showMessage() {
		this._messageWindow.open();
	}

	showPrice() {
		this._priceWindow.open();
	}

	showDate(d: string): any {
		let date = new Date(d);
		let hours = date.getHours();
		let minutes: number | string = date.getMinutes();
		let ampm = hours >= 12 ? 'PM' : 'AM';

		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0' + minutes : minutes;

		const strTime = `${hours}:${minutes} ${ampm}`;

		return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${strTime}`;
	}

	openQualifyParticipantDiag() {
		const diag = createQualifyParticipantDialogWindow(this._windowService);
		diag.componentRef.instance.submit.subscribe(res => {
			diag.destroy();
		});
		diag.componentRef.instance.close.subscribe(res => {
			diag.destroy();
		});
		diag.open();
	}

	removeEarlyBird() {
		this.form.controls.fee.controls.eventFeeType.setValue('RegularEventFee', {});
		this.form.controls.fee.controls.earlyPrice.reset(null, {});
	}

	timetrack() {
		let now = new Date();
		if (this.form.value.fee.eventFeeType == "EarlyBirdEventFee") {
			let endDate = new Date(this.form.controls.fee.controls.earlyPriceEndDate.value);
			if ((now.getTime() - endDate.getTime()) > 0) {
				this.removeEarlyBird();
			}
		}
	}

	ngOnDestroy() {
		this._messageWindow.destroy();
		this._priceWindow.destroy();
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}
