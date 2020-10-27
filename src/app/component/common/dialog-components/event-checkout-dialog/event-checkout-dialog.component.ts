import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage, } from '@app/models';

import { AlertService, SitemapService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createEventCheckoutDialogWindow(
	windowService: WindowService,
	eventSetupInfo: EventSetupInfo,

): DialogWindow<EventCheckoutDialogComponent> {
	return windowService.create<EventCheckoutDialogComponent>(
		EventCheckoutDialogComponent,
		{
			width: '80%',
			position: {
				left: '10%',
				top: '50px'
			},
			height: '100%',
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.eventSetupInfo = eventSetupInfo;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'event-checkout-dialog',
	templateUrl: './event-checkout-dialog.component.html',
	styleUrls: [
		'./event-checkout-dialog.component.css'
	  ]
})

export class EventCheckoutDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() eventSetupInfo: EventSetupInfo;
	@Output() submit = new EventEmitter<any>();
	@Output() close = new EventEmitter<void>();

	form: FormGroup;
	isValid: boolean = false;
	loading: boolean = false;

	step: string = 'AddToCart' // AddToCart, Checkout;

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

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this._windowService, 'fund.001');
		feedbackWindow.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	goToBack(e: MouseEvent) {
		this.close.emit();
	}
	
	onChangeStep(step: string) {
		this.step = step;
		this.refreshView();
	}

	onEditEvent(e) {
		this.submit.emit('Edit Event');
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this._changeDetectorRef.detectChanges();
	}
}
