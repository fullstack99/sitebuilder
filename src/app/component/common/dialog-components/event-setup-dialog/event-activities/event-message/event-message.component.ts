import {
	Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, Inject
	   } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { EventMessage } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

/**
 * Create new dialog window with `EventMessageComponent` inside.
 * 
 * @param windowService WindowService instance.
 * @param form `EventMessageForm` to be bound to the component.
 */
export function createEventMessageWindow(
	windowService: WindowService,
	form: EventMessageForm
): DialogWindow<EventMessageComponent> {
	return windowService.create<EventMessageComponent>(
		EventMessageComponent,
		{
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	)
	.changeInputs((messageComponent, window) => {
		messageComponent.form = form;
		messageComponent.close.subscribe(() => {
			window.close();
		});
	});
}

/**
 * Form type for `EventMessage`.
 */
export interface EventMessageForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		participantsMessage: FormControl;
		groupsMessage: FormControl;
	};
}
/**
 * Create new `EventMessageForm` from `EventMessage`.
 */
export function newEventMessageForm(v: EventMessage): EventMessageForm {
	return <EventMessageForm>new FormGroup({
		participantsMessage: new FormControl(v.participantsMessage),
		groupsMessage: new FormControl(v.groupsMessage)
	});
}

@Component({
	selector: 'event-message',
	templateUrl: './event-message.component.html',
	styleUrls: ['./event-message.component.css']
})
export class EventMessageComponent implements OnInit, OnDestroy {
	@Input('form') form: EventMessageForm;
	@Input('dispFeedback') dispFeedback: boolean = true;
	@Output('close') close = new EventEmitter<void>();

	private _formChangesSub: Rx.Subscription;	
	messageform: FormGroup;

	constructor(private _changeDetector: ChangeDetectorRef, private _windowService: WindowService, @Inject(FormBuilder) fb: FormBuilder) {
		this.messageform = fb.group({
			participantsMessage: '',
			groupsMessage: ''
		});
	}

	ngOnInit() {
		this.messageform.dirty
		this.messageform.controls["participantsMessage"].setValue(this.form.value.participantsMessage, {});
		this.messageform.controls["groupsMessage"].setValue(this.form.value.groupsMessage, {});
		this._formChangesSub = this.messageform.valueChanges.subscribe((x) => {
			this._changeDetector.detectChanges();
		});
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this._formChangesSub.unsubscribe();
	}
	openFeedback() {
		let window = createFeedbackDialogWindow(this._windowService, " 3.mes.130");
		window.open();
	}
	onSave() {
		this.form.controls.groupsMessage.setValue(this.messageform.value.groupsMessage, {});
		this.form.controls.participantsMessage.setValue(this.messageform.value.participantsMessage, {});
		this.onClose();
	}
}
