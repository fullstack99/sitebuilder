import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, ElementRef, ChangeDetectionStrategy,
	Renderer } from '@angular/core';
import {
	get as _get,
	keys as _keys,
} from 'lodash';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { Steps } from '@app-ui/steps/steps.component';
import { Item, CommonItemContent, EventSetupInfo, EventInfo, EventContactInfo, EventActivities, SimpleEvent } from '@app/models';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { EventService } from '@app/services/event.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createEventSetupDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<EventSetupInfo> = new CommonItemContent<EventSetupInfo>(Maybe.just(EventSetupInfo.empty())),
	eventSetupInfo: EventSetupInfo,
	width: number = 520,
): DialogWindow<EventSetupDialogComponent> {
	return windowService.create<EventSetupDialogComponent>(
		EventSetupDialogComponent,
		{
			width: width,
			height: '100%',
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = itemContent;
		comp.eventSetupInfo = eventSetupInfo;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'event-setup',
	templateUrl: './event-setup-dialog.component.html',
	styleUrls: ['./event-setup-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class EventSetupDialogComponent implements OnInit, AfterViewInit{

	@Input() itemContent: CommonItemContent<EventSetupInfo>;
	@Input() eventSetupInfo: EventSetupInfo;

	@Output() submit = new EventEmitter<CommonItemContent<EventSetupInfo> | EventSetupInfo>();
	@Output() close = new EventEmitter<void>();

	@ViewChild('placeButton') private placeButton: ElementRef;

	steps: Steps[] = [
		{ name: 'Event'	  , valid: false, touched: true, visited: true },
		{ name: 'Signup Type', valid: false, touched: false, visited: false },
		{ name: 'Participant Info', valid: false, touched: false, visited: false },
		{ name: 'Feedback', valid: false, touched: false, visited: false },
	];
	activeStepIndex = 0;
	isValid = false;
	newEdit = false;
	loading = false;

	eventInfo: EventInfo = EventInfo.empty();
	eventActivities: EventActivities = SimpleEvent.empty();
	eventContactInfo: EventContactInfo = EventContactInfo.empty();
	eventFeedback: { noThanks: false, survey: Item };

	private reviewData: Object = {};

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private renderer: Renderer,
		private _eventService : EventService,
		private _windowService: WindowService
	) {
	}

	ngOnInit() {
		if (!this.eventSetupInfo && this.itemContent.info.hasValue()) {
			this.eventSetupInfo = _get(this.itemContent, ['info', 'value']);
			this.newEdit = !_get(this.eventSetupInfo, ['title']);
		}

		if (this.eventSetupInfo) {
			_keys(this.eventInfo).map(key => {
				this.eventInfo[key] = this.eventSetupInfo[key];
			});
			this.eventContactInfo = this.eventSetupInfo.eventContactInfo;
			this.eventActivities = this.eventSetupInfo.eventActivitiesInfo;
		}

		this.eventFeedback = _get(this.eventSetupInfo, 'eventFeedback');

		if (!!this.eventFeedback) {
			this.steps[3].valid = true;
			this.steps[3].visited = true;
		}

		if (!this.newEdit) {
			for (let i = 1; i < 3; i++) {
				this.steps[i].valid = true;
				this.steps[i].visited = true;
			}
		}

	}

	ngAfterViewInit() {
		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = '10px';
	}

	onStepChange(i: number) {
		this._gotoStep(i);
	}

	onEventInfoChange(eventInfo: EventInfo) {
		this.eventInfo = eventInfo;
		//console.log(JSON.stringify(eventInfo));
	}

	onEventInfoTouched(touched: boolean) {
		this.steps[0].touched = this.steps[0].touched || touched;
	}

	onEventActivitiesChange(activities: EventActivities) {
		this.eventActivities = activities;
		this.steps[1].valid = true;
		this.refreshView();
	}

	onEventContactInfoChange(eventContactInfo: EventContactInfo) {
		this.eventContactInfo = eventContactInfo;
		this.steps[2].valid = true;
		this.refreshView();
	}

	onEventFeedbackChange(e) {
		this.eventFeedback = e;
		this.steps[3].valid = true;
		this.refreshView();
	}

	onStepValidityChange(valid: boolean, i: number) {
		this.steps[i].valid = valid;
		this.refreshView();
	}

	nextStep() {
		this._gotoStep(this.activeStepIndex + 1);
	}

	private _gotoStep(i: number) {
		this.reviewData = { eventInfo: this.eventInfo, eventActivities: this.eventActivities, eventContactInfo: this.eventContactInfo };
		this.activeStepIndex = i;
		this.steps[this.activeStepIndex].visited = true;
		if (i > 0) {
			this.steps[this.activeStepIndex].valid = true;
		}
		this.refreshView();
	}

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this._windowService, 'fund.001');
		feedbackWindow.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	onSubmit(event: MouseEvent) {
		const eventSetupInfo = EventSetupInfo.empty();

		_keys(this.eventInfo).map(key => {
			eventSetupInfo[key] = this.eventInfo[key];
		});

		eventSetupInfo.eventContactInfo = this.eventContactInfo;
		eventSetupInfo.eventActivitiesInfo = this.eventActivities;
		eventSetupInfo.eventFeedback = this.eventFeedback;

		if (this.eventSetupInfo && !this.itemContent) {
			this.loading = true;
			this.changeDetector.detectChanges();

			eventSetupInfo['json'] = JSON.stringify(eventSetupInfo);
			eventSetupInfo['uid'] = this.eventSetupInfo['uid'];

			this._eventService.updateEvent(eventSetupInfo).subscribe(
				res => {
					this.loading = false;
					this.changeDetector.detectChanges();
					this.submit.emit(eventSetupInfo);
				},
				error => {
					this.loading = false;
					this.changeDetector.detectChanges();
				}
			)
		} else if (this.itemContent) {
			const top = Math.max(this.itemContent.box.top, 10);
			let width = 300;

			// if (infoStr.indexOf('EarlyBirdEventFee')>=0) {
			//	 width = infoStr.indexOf('EventWithParticipantTypes')>=0 ? 420 : 350;
			// }

			this.submit.emit(this.itemContent.setInfo(Maybe.just(eventSetupInfo)).setBox(new Box(this.itemContent.box.left, this.itemContent.box.left + width, top, 100)));
		}
	}

	refreshView() {
		this.isValid = this.steps.findIndex((step, index) => {

			if (step.valid === false)
				return false;

			switch (index) {
				case 0:
					return differenceDeep.isDifference(_get(this.eventSetupInfo, 'eventInfo'), this.eventInfo);
				case 1:
					return differenceDeep.isDifference(_get(this.eventSetupInfo, 'eventContactInfo'), this.eventContactInfo);
				case 2:
					return differenceDeep.isDifference(_get(this.eventSetupInfo, 'eventActivitiesInfo'), this.eventActivities);
			}
		}) >= 0;

		this.changeDetector.detectChanges();
	}
}
