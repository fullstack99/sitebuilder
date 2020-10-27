import { Component, ChangeDetectorRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createAddThemeToWebsiteDialogWindow(
	windowService: WindowService,
): DialogWindow<AddThemeToWebsiteDialogComponent> {
	return windowService.create<AddThemeToWebsiteDialogComponent>(
			AddThemeToWebsiteDialogComponent,
				{
					width: 320,
					position: {
						left: 'calc(50% - 160px)',
						top: 'calc(50% - 160px)'
					},
					modal: true,
					draggable: false,
					resizable: true,
					scrollable: false,
					visible: false,
					title: false
				}
	)
	.changeInputs((comp, window) => {
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
  	selector: 'add-theme-to-website',
  	templateUrl: './add-theme-to-website-dialog.component.html',
  	styleUrls: ['./add-theme-to-website-dialog.component.css']
})

export class AddThemeToWebsiteDialogComponent implements OnInit, OnDestroy {

	@Output() submit = new EventEmitter<string>();
	@Output() close = new EventEmitter<void>();

	chooseOptionControl: FormControl = new FormControl('keep');

	private _subs: Subscription[] = [];

	constructor(
		private _changeDetector: ChangeDetectorRef,
		private _windowService: WindowService
	) { }

	ngOnInit() {
		this._subs = [
			this.chooseOptionControl.valueChanges.subscribe(res => {
				this._changeDetector.detectChanges();
			})
		]
	}

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this._windowService, 'fo.d.122');
		feedbackWindow.open();
	}

	onSubmit() {
		this.submit.emit(this.chooseOptionControl.value);
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}
}

