import { Component, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createPageImportCheckGlobalDialogWindow(
	windowService: WindowService
	
): DialogWindow<PageImportCheckGlobalDialogComponent> {
	return windowService.create<PageImportCheckGlobalDialogComponent>(
		PageImportCheckGlobalDialogComponent,
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
	selector: 'page-import-check-global-dialog',
	templateUrl: './page-import-check-global-dialog.component.html',
	styleUrls: [
		'./page-import-check-global-dialog.component.css'
	  ]
})

export class PageImportCheckGlobalDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Output() submit = new EventEmitter<boolean>();
	@Output() close = new EventEmitter<void>(); 

	public importOption = new FormControl(true);

	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private windowService: WindowService
	) { }

	ngOnInit() {
		this.subs = [
			this.importOption.valueChanges.subscribe((x) => {
				this.changeDetectorRef.detectChanges();
			})
		];
	}

	ngAfterViewInit() {

	} 

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
		feedbackWindow.open();
	}

	onSubmit() {  
		this.submit.emit(this.importOption.value);
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this.changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
