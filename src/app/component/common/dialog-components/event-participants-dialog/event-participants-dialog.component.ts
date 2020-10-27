import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { ContactInfoField, } from '@app/models';

import { AlertService, SitemapService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { onErrorResumeNext } from 'rxjs/operator/onErrorResumeNext';

export function createParticipantsDialogWindow(
	windowService: WindowService,

): DialogWindow<EventParticipantsDialogComponent> {
	return windowService.create<EventParticipantsDialogComponent>(
		EventParticipantsDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'event-participants-dialog',
	templateUrl: './event-participants-dialog.component.html',
	styleUrls: [
		'./event-participants-dialog.component.css'
	  ]
})

export class EventParticipantsDialogComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input() contactInfoFields: ContactInfoField[] = [];
	@Output() submit = new EventEmitter<any>();
	@Output() close = new EventEmitter<void>();

	form: FormGroup;
	isValid: boolean = false;
	loading: boolean = false;

	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private _fb: FormBuilder,
		private changeDetectorRef: ChangeDetectorRef,
		private alertService: AlertService,
		private windowService: WindowService
	) {
	}

	ngOnInit() {
		this.subs = [
		];
	}

	ngAfterViewInit() {
		console.log(this.contactInfoFields);
	}

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
		feedbackWindow.open();
	}

	onSubmit() {
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
