import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createLayoutChangesWindow(
	windowService: WindowService	
): DialogWindow<LayoutChangesComponent> {
	return windowService.create<LayoutChangesComponent>(
		LayoutChangesComponent,
		{
			width: 380,
			height: 250,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'layout-changes.component.html',
	styleUrls: ['layout-changes.component.css']
})
export class LayoutChangesComponent implements OnInit, OnDestroy {

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<boolean>();	

	public selectOption = new FormControl(true, [Validators.required]);	
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService
	) {}

	ngOnInit() {
		this.subs = [
			this.selectOption.valueChanges.subscribe(res => {
				this.changeDetector.detectChanges();
			})
		];
	}

	onClose() {
		this.close.emit();
	}

	onSubmit(val: boolean) {
		this.submit.emit(val);
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
