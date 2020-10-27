import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
		 Renderer, OnChanges, SimpleChanges, ViewChild, ElementRef
	   } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Branch } from '@app-models/survey-info';

import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createLinkAnswerDialogWindow(
	windowService: WindowService,
	option: {text: string, link: any}
): DialogWindow<LinkAnswerDialogComponent> {
	return windowService.create<LinkAnswerDialogComponent>(
	  LinkAnswerDialogComponent,
		{
			width: 320,
			minHeight: 400,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	)
	.changeInputs((comp, window) => {
		comp.option = option;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'link-answer-dialog.component.html',
	styleUrls: ['link-answer-dialog.component.css']
})
export class LinkAnswerDialogComponent implements OnInit, OnDestroy {

	@Input() option: {text: string, link: any} = {text: '', link: null};

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<Branch>();

	currentBranch: Branch;

	branches: Branch[] = [];
	private _subs: Subscription[];

	// ---------------------------------------------------------------
	constructor(
		private _changeDetector: ChangeDetectorRef,
		private _appService: AppService,
	) {}

	ngOnInit() {
		if (this._appService._surveyInfo)
			this.branches = this._appService._surveyInfo.branches;

		if (this.option.link) {
		  this.currentBranch = this.branches.find(b => b.name == this.option.link);
		}

		this._subs = [
		];
	}

	onSetBranch(item) {
	  this.currentBranch = item;
	  this._changeDetector.detectChanges();
	}

	onClose(e: MouseEvent) {
		this.close.emit();
	}

	onSubmit() {
		if (!this.currentBranch)
		  return;
		this.submit.emit(this.currentBranch);
	}

	openFeedbackDialog(e: MouseEvent) {
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}
}
