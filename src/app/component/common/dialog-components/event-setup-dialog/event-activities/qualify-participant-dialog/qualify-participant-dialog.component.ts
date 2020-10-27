import { Component, Input, Output, OnInit, ChangeDetectorRef, EventEmitter, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createQualifyParticipantDialogWindow(
	windowService: WindowService,
	uid: string = ''
): DialogWindow<QualifyParticipantDialogComponent> {
	return windowService.create<QualifyParticipantDialogComponent>(
		QualifyParticipantDialogComponent,
		{
			width: 340,
			height: 510,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.uid = uid;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'qualify-participant-dialog',
	templateUrl: 'qualify-participant-dialog.component.html',
	styleUrls: ['qualify-participant-dialog.component.css']
})
export class QualifyParticipantDialogComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() uid: string = '';

	@Output('submit') submit = new EventEmitter<string>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('textArea') _textArea: ElementRef;

	form: FormGroup;

	private _viewInited = false;
	private _subs: Subscription[] = [];

	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetectorRef: ChangeDetectorRef,
		private _windowService: WindowService
	) {
		this.form = this._formBuilder.group({
			willbeAddedInMyAccount: [false],
			hasEmails: [false],
			emails: [''],
		});
	}

	ngOnInit() {
		this._subs = [
			this.form.valueChanges.subscribe(res => {
				this.refreshView();
			})
		];
	}

	ngAfterViewInit() {
		this._viewInited = true;
		this._textArea.nativeElement.placeholder = this._textArea.nativeElement.placeholder.replace(/\\n/g, '\n');
	}

	openFeedbackDialog(event: MouseEvent) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	onClose(event: MouseEvent) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		if (this._viewInited)
			this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		this._viewInited = false;
		this._subs.forEach(s => s.unsubscribe());
	}
}
