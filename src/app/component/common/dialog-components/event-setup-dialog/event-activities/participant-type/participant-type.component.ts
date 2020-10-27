import { Component, Input, Output, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { EventParticipantType } from '@app/models';
import { EventAdmissionForm, newEventAdmissionForm } from '@app-dialogs/event-setup-dialog/event-activities/event-admission/event-admission.component';
import { EventMessageComponent, createEventMessageWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { EventFeeComponent, createEventFeeWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-fee-early-bird/event-fee-early-bird.component';
import { createQualifyParticipantDialogWindow } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/**
 * Form type for `EventParticipantType`.
 */
export interface EventParticipantTypeForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name: FormControl;
		admission: EventAdmissionForm;
	};
}

/**
 * Create new `EventParticipantTypeForm` from `EventParticipantType`.
 */
export function newEventParticipantTypeForm(v: EventParticipantType): EventParticipantTypeForm {
	return <EventParticipantTypeForm>new FormGroup({
		name: new FormControl(v.name),
		admission: newEventAdmissionForm(v.admission)
	});
}

@Component({
	selector: 'participant-type',
	templateUrl: './participant-type.component.html',
	styleUrls: ['./participant-type.component.css'],
	providers: []
})

export class ParticipantTypeComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() form: EventParticipantTypeForm;
	@Input() canBeRemoved: boolean;
	@Output() removeCommand = new EventEmitter<void>();

	a = '1';
	private _messageWindow: DialogWindow<EventMessageComponent>;
	private _priceWindow: DialogWindow<EventFeeComponent>;
	private _subs: Rx.Subscription[] = [];

	constructor(
		private _windowService: WindowService,
		private _changeDetector: ChangeDetectorRef) {}

	ngOnInit() {
		this._subs = [
			this.form.valueChanges.subscribe(result => {
				this._changeDetector.detectChanges();
			})
		];
	}

	ngAfterViewInit () {
		this._messageWindow = createEventMessageWindow(
			this._windowService, this.form.controls.admission.controls.message);

		this._priceWindow = createEventFeeWindow(
			this._windowService, this.form.controls.admission.controls.fee);

		setInterval(() => this.timetrack(), 1000);
	}

	showMessage() {
		this._messageWindow.open();
	}

	showPrice() {
		this._priceWindow.open();
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

	remove() {
		this.removeCommand.emit(undefined);
	}

	removeEarlyBird() {
		this.form.controls.admission.controls.fee.controls.eventFeeType.setValue('RegularEventFee', {});
		this.form.controls.admission.controls.fee.controls.earlyPrice.reset(null, {});
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

	timetrack() {
		let now = new Date();
		if (this.form.value.admission.fee.eventFeeType == "EarlyBirdEventFee") {
			let endDate = new Date(this.form.controls.admission.controls.fee.controls.earlyPriceEndDate.value);
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
