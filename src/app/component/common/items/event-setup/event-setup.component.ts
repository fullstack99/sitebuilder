import { Component, Input, Output, OnInit, OnChanges, OnDestroy, AfterViewInit, ElementRef, ChangeDetectorRef, EventEmitter, ViewChild, Renderer2 } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import {
	matches as _matches,
	keys as _keys,
} from 'lodash';

import * as imageUrl from '@app-lib/functions/image-url';
import { Item, CommonItemContent,
		EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage,
		ImagePath } from '@app/models';
import {
	EventMessageComponent, EventMessageForm, newEventMessageForm,
	createEventMessageWindow
} from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';
import { createEventSetupDialogWindow } from '@app-dialogs/event-setup-dialog/event-setup-dialog.component';
import { createEventSignUpDialogWindow } from '@app-dialogs/event-signup-dialog/event-signup-dialog.component';
import { createEventCheckoutDialogWindow } from '@app-dialogs/event-checkout-dialog/event-checkout-dialog.component';
import { createParticipantsDialogWindow } from '@app-dialogs/event-participants-dialog/event-participants-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'event-setup-item',
	templateUrl: './event-setup.component.html',
	styleUrls: ['./event-setup.component.css']
})

export class EventSetupItemComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() item: Item;
	@Input() editable = true;
	@Output() itemChange = new EventEmitter<Item>();
	@Output() fileDrop = new EventEmitter<any>();

	@ViewChild('reviewContainer') reviewContainer: ElementRef;

	public eventInfo: EventInfo;
	public eventActivities: any;
	public eventContactInfo: any;

	private _messageWindow: DialogWindow<EventMessageComponent>;
	private _messageForm: EventMessageForm;

	private detectDefaultChange: any;
	private defaultEventMessage: EventMessage;

	public tickets: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	public signedUp: any = null;

	constructor(
		private _windowService: WindowService,
		private _changeDetector: ChangeDetectorRef,
		private _sanitizer: DomSanitizer
	) {
		this.defaultEventMessage = new EventMessage('', '');
		this.detectDefaultChange = _matches(JSON.stringify(this.defaultEventMessage));
	}

	ngOnInit() {
		const eventSetupInfo = (this.item.content as CommonItemContent<EventSetupInfo>).info.value;
		this.eventInfo = EventInfo.empty();
		_keys(this.eventInfo).map(key => {
			this.eventInfo[key] = eventSetupInfo[key];
		});
		this.eventContactInfo = eventSetupInfo.eventContactInfo;
		this.eventActivities = eventSetupInfo.eventActivitiesInfo;
		this.timetrack();
		setInterval(() => this.timetrack(), 1000);
	}

	ngAfterViewInit() {
		setTimeout(() => {
			const height = this.item.content.box.height();
			const eleHeight = (this.reviewContainer.nativeElement as HTMLElement).offsetHeight + 50;
			if (height !== eleHeight)
				this.itemChange.emit(this.item.setContent(this.item.content.setBox(this.item.content.box.setBottom(this.item.content.box.top + eleHeight))));
		});
	}

	ngOnDestroy() {
		if (this._messageWindow)
			this._messageWindow.destroy();
	}

	detectExistMessage(message: EventMessage): boolean {
		return !this.detectDefaultChange(JSON.stringify(message));
	}

	onAddEventToCalendar() {

	}

	openGoogleMapsDialog() {
		const dialog = createGoogleMapsDialogWindow(this._windowService, this.eventInfo.address1 + ', ' + this.eventInfo.city + ', ' + this.eventInfo.state);
			dialog.componentRef.instance.outLocation.subscribe(result => {
				dialog.destroy();
			});
			dialog.componentRef.instance.close.subscribe(() => {
				dialog.destroy();
			});
			dialog.open();
	}

	openEventSignUpDialog() {
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
			this.signedUp = true;
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	openEventSetupDialogWindow() {
		const dialog = createEventSetupDialogWindow(this._windowService, this.item.content as CommonItemContent<EventSetupInfo>, null);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
			this.itemChange.emit(this.item.setContent(res));
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	openEventCheckoutDialog() {
		const dialog = createEventCheckoutDialogWindow(this._windowService, (this.item.content as CommonItemContent<EventSetupInfo>).info.value);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
			this.signedUp = true;

			if (res == 'Edit Event')
				this.openEventSetupDialogWindow();
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	openParticipantsDialog() {
		const dialog = createParticipantsDialogWindow(this._windowService);
		dialog.componentRef.instance.submit.subscribe(res => {
			dialog.destroy();
		});
		dialog.componentRef.instance.close.subscribe(() => {
			dialog.destroy();
		});
		dialog.open();
	}

	showMessage(message: EventMessage) {
		this._messageForm = newEventMessageForm(message);
		this._messageWindow = createEventMessageWindow(
			this._windowService, this._messageForm);
		this._messageWindow.changeInputs((messageComponent, window) => {
			messageComponent.dispFeedback = false;
		});
		this._messageWindow.open();
	}

	timetrack() {
		const now = new Date();
		switch (this.eventActivities.eventType) {
			case 'SimpleEvent':
				if (this.eventActivities.admission.fee.eventFeeType == 'EarlyBirdEventFee') {
					let endDate = new Date(this.eventActivities.admission.fee.earlyPriceEndDate);
					if ((now.getTime() - endDate.getTime()) > 0) {
						this.eventActivities.admission.fee.eventFeeType = 'RegularEventFee';
						this._changeDetector.detectChanges();
					}
				}
				break;
			case 'EventWithActivitiesSingleFee':
				if (this.eventActivities.admission.fee.eventFeeType == 'EarlyBirdEventFee') {
					let endDate = new Date(this.eventActivities.admission.fee.earlyPriceEndDate);
					if ((now.getTime() - endDate.getTime()) > 0) {
						this.eventActivities.admission.fee.eventFeeType = 'RegularEventFee';
						this._changeDetector.detectChanges();
					}
				}
				break;
			case 'EventWithParticipantTypes':
				this.eventActivities.participantTypes.map((ele: any) => {
					if (ele.admission.fee.eventFeeType == 'EarlyBirdEventFee') {
						let endDate = new Date(ele.admission.fee.earlyPriceEndDate);
						if ((now.getTime() - endDate.getTime()) > 0) {
							ele.admission.fee.eventFeeType = 'RegularEventFee';
							this._changeDetector.detectChanges();
						}
					}
				});
				break;
			default:
				// code...
				break;
		}
	}

	showDate(date: Date): any {
		if (!date) return '';
		let hours = date.getHours();
		let minutes: number | string = date.getMinutes();
		let ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0' + minutes : minutes;
		const strTime = hours + ':' + minutes + ' ' + ampm;
 		return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${strTime}`;
	}

	backgroundImage(image: ImagePath): SafeStyle {
		return image ? this._sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image)) : '';
  	}
}
