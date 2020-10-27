import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createEcommChooseItemDialogWindow(
	windowService: WindowService,
	isNew: boolean,
	isSingle: boolean,
	diagMode: string = 'single'
): DialogWindow<EcommChooseItemDialogComponent> {
	return windowService.create<EcommChooseItemDialogComponent>(
		EcommChooseItemDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.isNew = isNew;
		comp.diagMode = diagMode;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'ecomm-choose-item-dialog.component.html',
	styleUrls: ['ecomm-choose-item-dialog.component.css']
})

export class EcommChooseItemDialogComponent implements OnInit, OnDestroy {

	@Input() isNew: boolean = false;
	@Input() isSingle: boolean = false;
	@Input() diagMode: string = 'single';

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<string>();

	public selectOption = new FormControl("new");

	private subs: Rx.Subscription[] = [];

	constructor(
		private windowService: WindowService

	) {}

	ngOnInit() {
		if (!this.isNew && this.diagMode == 'single')
			this.selectOption.setValue('edit');
		else if (this.diagMode == 'multiple')
			this.selectOption.setValue('existItem');

		this.subs = [
		];
	}

	onClose() {
		this.close.emit();
	}

	onSubmit(val: any) {
		this.submit.emit(val);
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
