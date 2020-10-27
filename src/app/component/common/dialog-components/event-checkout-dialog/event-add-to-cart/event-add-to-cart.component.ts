import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';
import {
	range as _range,
	parseInt as _parseInt,
	sumBy as _sumBy
} from 'lodash';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage, } from '@app/models';
import { createQualifyParticipantDialogWindow } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.component';
import { AlertService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


@Component({
	moduleId: module.id,
	selector: 'event-add-to-cart',
	templateUrl: './event-add-to-cart.component.html',
	styleUrls: ['../event-checkout-dialog.component.css']
})

export class EventAddToCartComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() eventSetupInfo: EventSetupInfo = EventSetupInfo.empty();

	@Output() goCheckout = new EventEmitter<void>();

	form: FormGroup;
	isValid: boolean = false;
	loading: boolean = false;

	startTime: string = '';
	endTime: string = '';

	tickets: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	ticketOrders: any = [];
	guestOrders: any = [];
	dispTicketOrders = [];
	totalPrice = 0;
	selectedActivities = [];
	activityTickets = [];
	guestNum = [];
	admissionTicket = 0;

	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private _fb: FormBuilder,
		private _changeDetectorRef: ChangeDetectorRef,
		private _alertService: AlertService,
		private _windowService: WindowService
	) {
	}

	ngOnInit() {
		const startDate = moment.utc(this.eventSetupInfo.startDate).local();
		const endDate = moment.utc(this.eventSetupInfo.endDate).local();
		this.startTime = startDate.format('LT');
		this.endTime = endDate.format('LT');

		switch (this.eventSetupInfo.eventActivitiesInfo.eventType) {
			case 'SimpleEvent':
				this.ticketOrders = [
					{
						name: 'Admission',
						price: this.eventSetupInfo.eventActivitiesInfo.admission.fee.price,
						ticket: 0,
					}
				];
				this.tickets = this.eventSetupInfo.eventActivitiesInfo.admission.participantsLimit ? _range(0, (_parseInt(this.eventSetupInfo.eventActivitiesInfo.admission.participantsLimit) || 0) + 1) : _range(0, 100);
				break;
			case 'EventWithActivitiesSingleFee':
				this.ticketOrders = this.eventSetupInfo.eventActivitiesInfo.activities.map(activity => {
					this.selectedActivities.push(false);
					return {
						name: activity.name,
						price: this.eventSetupInfo.eventActivitiesInfo['admission'].fee.price,
						ticket: 0,
					};
				});
				this.tickets = this.eventSetupInfo.eventActivitiesInfo.admission.participantsLimit ? _range(0, (_parseInt(this.eventSetupInfo.eventActivitiesInfo.admission.participantsLimit) || 0) + 1) : _range(0, 100);
				break;
			case 'EventWithActivitiesMultiFee':
				this.ticketOrders = this.eventSetupInfo.eventActivitiesInfo.activities.map((activity, i) => {
					this.activityTickets[i] = (activity.participantsLimit ? _range(0, (_parseInt(activity.participantsLimit) || 0) + 1) : _range(0, 100));
					return {
						name: activity.name,
						price: activity.fee.price,
						ticket: 0,
					};
				});
				break;
			case 'EventWithParticipantTypes':
				for (let i = 0; i < this.eventSetupInfo.eventActivitiesInfo.participantTypes.length; i++) {
					const p = this.eventSetupInfo.eventActivitiesInfo.participantTypes[i];
					this.activityTickets[i] = (p.admission.participantsLimit ? _range(0, (_parseInt(p.admission.participantsLimit) || 0) + 1) : _range(0, 100));
					this.guestNum[i] = (p.admission.guests ? _range(0, (_parseInt(p.admission.guests) || 0) + 1) : _range(0, 100));
					this.ticketOrders.push({
						name: p.name,
						price: p.admission.fee.price,
						ticket: 0,
					});
					this.guestOrders.push({
						num: 0,
						names: []
					});
				}
				break;
		}

		this.updateDispTicketOrders();

		this.subs = [
		];
	}

	ngAfterViewInit() {
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}

	onAddCart(e: MouseEvent) {
		this.goCheckout.emit();
	}

	showDate(temp: Date): any {
		if (!temp) return '';
		const date = moment.utc(temp).local();
		return date.format('MM/DD/YYYY HH:mm:ss');
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

	onChangeGuestOrders(num, i) {
		this.guestOrders[i].num = num;
		if (this.guestOrders[i].names.length > num) {
			this.guestOrders[i].names.length = num;
		} else if (this.guestOrders[i].names.length < num) {
			for (let j = this.guestOrders[i].names.length; j < num; j++) {
				this.guestOrders[i].names.push('');
			}
		}
		this.refreshView();
	}

	onChangeTicket(ticket, i) {
		if (this.eventSetupInfo.eventActivitiesInfo.eventType === 'SimpleEvent' || this.eventSetupInfo.eventActivitiesInfo.eventType === 'EventWithActivitiesSingleFee') {
			this.admissionTicket = ticket;
			if (this.eventSetupInfo.eventActivitiesInfo.eventType === 'EventWithActivitiesSingleFee')
				for (let i = 0; i < this.ticketOrders.length; i++) {
					if (this.selectedActivities[i]) {
						this.ticketOrders[i].ticket = ticket;
					} else {
						this.ticketOrders[i].ticket = 0;
					}
				}
		} else {
			this.ticketOrders[i].ticket = ticket;
		}
		this.refreshView();
	}

	onSelectActivity(e, i) {
		this.selectedActivities[i] = e;
		if (this.eventSetupInfo.eventActivitiesInfo.eventType === 'EventWithActivitiesSingleFee')
			this.onChangeTicket(this.admissionTicket, 0);
	}

	updateDispTicketOrders(): any {
		this.dispTicketOrders = this.ticketOrders.filter(t => t.ticket > 0);
		this.totalPrice = _sumBy(this.dispTicketOrders, (t) => t.price * t.ticket);
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.updateDispTicketOrders();
		this._changeDetectorRef.detectChanges();
	}
}
