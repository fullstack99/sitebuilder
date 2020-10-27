import { Component, Input, Output, OnInit, OnChanges, OnDestroy, AfterViewInit, ElementRef, ChangeDetectorRef, EventEmitter, ViewChild, Renderer2 } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import {
	matches as _matches,
	keys as _keys,
} from 'lodash';
import * as moment from 'moment';
import * as ics from 'ics-js';
import * as filesaver from 'file-saver';
import {
	Subscription
} from 'rxjs';

import * as imageUrl from '@app-lib/functions/image-url';
import { Item, CommonItemContent,
		EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage,
		ImagePath, Link, LinkPage } from '@app/models';
import {
	EventMessageComponent, EventMessageForm, newEventMessageForm,
	createEventMessageWindow
} from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';
import { createEventSignUpDialogWindow } from '@app-dialogs/event-signup-dialog/event-signup-dialog.component';
import { createEventCheckoutDialogWindow } from '@app-dialogs/event-checkout-dialog/event-checkout-dialog.component';
import { createEventSetupDialogWindow } from '@app-dialogs/event-setup-dialog/event-setup-dialog.component';

import { AppService } from '@app/app.service';
import { EventService } from '@app/services/event.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

// const ics = require('ics')

@Component({
	moduleId: module.id,
	selector: 'event-report',
	templateUrl: './event-report.component.html',
	styleUrls: ['./event-report.component.css']
})

export class EventReportComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() eventSetupInfo: any;
	@Input() editable: boolean = true;

	@Output('outLink') outLink = new EventEmitter<Link>();
	@Output() eventSetupInfoChange = new EventEmitter<any>();

	public eventInfo: EventInfo = EventInfo.empty();
	public eventActivities: any;
	public eventContactInfo: any;

	public year = '';
	public month = '';
	public date = '';
	public day = '';
	public startTime = '';
	public endTime = '';
	public backgroundImage = null;
	public visibleDescription = false;

	public loading: boolean = false;

	private _callingAPI: Subscription;

	constructor (
		private _eventService: EventService,
		private _windowService: WindowService,
		private _appService: AppService,
		private _changeDetector: ChangeDetectorRef,
	) {
	}

	ngOnInit() {
		this.eventInfo = EventInfo.empty();
		_keys(this.eventInfo).map(key => {
			this.eventInfo[key] = this.eventSetupInfo[key];
		});
		this.eventContactInfo = this.eventSetupInfo.eventContactInfo;
		this.eventActivities = this.eventSetupInfo.eventActivitiesInfo;

		const startDate = moment.utc(this.eventInfo.startDate).local();
		const endDate = moment.utc(this.eventInfo.endDate).local();
		this.year = startDate.format('YYYY');
		this.month = startDate.format('MMM');
		this.date = startDate.format('D');
		this.day = startDate.format('ddd');
		this.startTime = startDate.format('LT');
		this.endTime = endDate.format('LT');
		this.backgroundImage = this.eventSetupInfo.image ? imageUrl.imageSrcUrl(this.eventSetupInfo.image) : '';
	}

	ngAfterViewInit() {
	}

	ngOnDestroy() {
	}

	showDate(temp: Date): any {
		if (!temp) return '';
		const date = moment.utc(temp).local();
		return date.format('MM/DD/YYYY HH:mm:ss');
		// let hours = date.getHours();
		// let minutes: number | string = date.getMinutes();
		// let ampm = hours >= 12 ? 'PM' : 'AM';
		// hours = hours % 12;
		// hours = hours ? hours : 12; // the hour '0' should be '12'
		// minutes = minutes < 10 ? '0' + minutes : minutes;
		// const strTime = hours + ':' + minutes + ' ' + ampm;
		// return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${strTime}`;
	}

	onViewDescription(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		this.visibleDescription = !this.visibleDescription;
	}

	openEventSignUpDialog(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		
		const result: any[] = [];

		// const fields = [].concat(this.eventContactInfo.participantContactInfo.hasDefaultFields)
		// 	.concat(this.eventContactInfo.participantContactInfo.defaultFields)
		// 	.concat(this.eventContactInfo.participantContactInfo.customFields)
		// 	.filter((x: any) => x.choose);

		// for (let i = 0; i < fields.length; i++) {
		// 	if (typeof fields[i].secondary != 'undefined') {
		// 		result.push(...fields[i].secondary);
		// 	} else {
		// 		result.push(...fields[i]);
		// 	}
		// }

		const dialog = createEventSignUpDialogWindow(this._windowService, result);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	openEventSetup(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();

		if (!this.eventSetupInfo.eventContactInfo)
			return;

		const dialog = createEventSetupDialogWindow(this._windowService, null, this.eventSetupInfo);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
			this.eventSetupInfoChange.emit(res);
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	openEventCheckoutDialog(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		const dialog = createEventCheckoutDialogWindow(this._windowService, this.eventSetupInfo);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	onClickCalendar(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();

		const cal = new ics.VCALENDAR();
		const event = new ics.VEVENT();
		cal.addProp('VERSION', 2) // Number(2) is converted to '2.0'
		cal.addProp('PRODID', this.eventInfo.title);
		cal.addProp('METHOD', 'PUBLISH');
		cal.addProp('CALSCALE', 'GREGORIAN');

		event.addProp('UID');
		event.addProp('DTSTAMP', new Date());
		event.addProp('DTSTART',  new Date(this.eventInfo.startDate));
		event.addProp('DTEND', new Date(this.eventInfo.endDate));
		event.addProp('SUMMARY', this.eventInfo.title);
		event.addProp('DESCRIPTION', this.eventInfo.description);
		event.addProp('LOCATION', this.eventInfo.address1);
		cal.addComponent(event);
		filesaver.saveAs(cal.toBlob(), `${this.eventInfo.title}.ics`);
	}

	onOutLink() {
		this.outLink.emit(new LinkPage(this.eventSetupInfo['uid']));
	}

	onMouseDownButton(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		if (!this.loading && this._callingAPI) {
			this._callingAPI.unsubscribe();
			this._callingAPI = null;
		}
	}
}

