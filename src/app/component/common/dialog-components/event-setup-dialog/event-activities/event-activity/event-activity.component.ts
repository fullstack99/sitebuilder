import { Component, Input, Output, EventEmitter, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, HostBinding } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { DateRange } from '@app-ui/datetime-range/daterange';
import { EventActivity, EventActivityWithFee } from '@app/models';
import { EventMessageComponent, EventMessageForm, newEventMessageForm, createEventMessageWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { EventFeeComponent, EventFeeForm, newEventFeeForm, createEventFeeWindow } from '@app-dialogs/event-setup-dialog/event-activities/event-fee-early-bird/event-fee-early-bird.component';
import { createQualifyParticipantDialogWindow } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/**
 * Form type for `EventActivity` or `EventActivityWithFee`.
 */
export interface EventActivityForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name: FormControl;
		message: EventMessageForm;
		startDate: FormControl;
		endDate: FormControl;
		fee: EventFeeForm;
		participantsLimit: FormControl;
	};
}

/**
 * Create new `EventActivityForm` from `EventActivity` or `EventActivityWithFee`.
 */
export function newEventActivityForm(value: EventActivity | EventActivityWithFee): EventActivityForm {
	const v = value as EventActivity & EventActivityWithFee;
	return <EventActivityForm>new FormGroup({
		name: new FormControl(value.name),
		message: newEventMessageForm(value.message),
		startDate: new FormControl(value.startDate),
		endDate: new FormControl(value.endDate),
		fee: newEventFeeForm(v.fee),
		participantsLimit: new FormControl(value.participantsLimit)
	});
}

@Component({
	selector: 'event-activity',
	templateUrl: './event-activity.component.html',
	styleUrls: ['./event-activity.component.css'],
	providers: []
})
export class EventActivityComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() form: EventActivityForm;
	@Input() hasFee: boolean;
	@Input() canBeRemoved: boolean;

	@Output('removeCommand') removeCommand = new EventEmitter<void>();

	@HostBinding('class.ready-to-drag') readyToDrag = false;

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
