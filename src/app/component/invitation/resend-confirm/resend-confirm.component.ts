import { Component, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

 
export function createResendConfirmDialogWindow(
	windowService: WindowService	
): DialogWindow<ResendConfirmDialogComponent> {
	return windowService.create<ResendConfirmDialogComponent>(
		ResendConfirmDialogComponent,
		{
			width: 350,
			position: {
				left: 'calc(50% - 175px)',
				top: '150px'
			},			
			modal: true,
			draggable: false,
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
	selector: 'app-resend-confirm',
	templateUrl: './resend-confirm.component.html',
	styleUrls: ['./resend-confirm.component.css']
})
export class ResendConfirmDialogComponent implements OnInit {

	@Output() submit = new EventEmitter<boolean>();
	@Output() close = new EventEmitter<void>();
	
	confirm: FormControl = new FormControl(false);
	private subs: Rx.Subscription[] = [];

	constructor(		
		private changeDetector: ChangeDetectorRef,		
		private windowService: WindowService		
	) {
	}
	
	ngOnInit() {
		this.subs = [			
		]
	}

	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');		
		feedbackWindow.open();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		this.submit.emit(this.confirm.value);
	}

	ngDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}

}
