import { Component, Input, Output, EventEmitter,
		OnInit, OnChanges, SimpleChanges, OnDestroy, AfterViewInit,
		ChangeDetectorRef,
	   } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, FormArray } from '@angular/forms';
 import { Subscription } from 'rxjs';
import {
	get as _get
} from 'lodash';

import { Item } from '@app/models';
import { createEventFeedbackDialogWindow } from './event-feedback-dialog/event-feedback-dialog.component';

import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'event-feedback',
	templateUrl: './event-feedback.component.html',
	styleUrls: ['./event-feedback.component.css']
})
export class EventFeedbackComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() eventFeedback: { noThanks: boolean, survey: Item } = null;
	@Output() eventFeedbackChange = new EventEmitter<any>();
	
	noThanks: FormControl = new FormControl(false);
	private _subs: Subscription[] = [];

	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetector: ChangeDetectorRef,
		private _windowService: WindowService,
	) {
	}

	ngOnInit() {
		this._subs = [
			this.noThanks.valueChanges.subscribe(res => {
				this.onEventFeedbackChange(res, _get(this.eventFeedback, 'survey'));
			}),
		];
	}

	ngAfterViewInit() {
		if (!this.eventFeedback)
			this.eventFeedbackChange.emit({ noThanks: false, survey: null});
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}

	openEventFeedbakDialog() {
		const dialog = createEventFeedbackDialogWindow(this._windowService, _get(this.eventFeedback, 'survey'));
		dialog.componentRef.instance.submit.subscribe(res => {
			this.onEventFeedbackChange(this.noThanks.value, res);
		});
		dialog.componentRef.instance.close.subscribe(res => {
			dialog.destroy();
		});
		dialog.open();
	}

	onEventFeedbackChange(noThanks: boolean, survey: Item) {
		if (this.eventFeedback) {
			this.eventFeedback.noThanks = noThanks;
			this.eventFeedback.survey = survey;
		} else
			this.eventFeedback = { noThanks: noThanks, survey: survey};

		this.eventFeedbackChange.emit(this.eventFeedback);
	}
}
