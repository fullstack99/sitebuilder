import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChild, ViewChildren, ElementRef, HostListener, Input, OnChanges, SimpleChanges,
	QueryList, AfterViewInit, Renderer
} from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createBranchDialogWindow(
	windowService: WindowService,
	width: number = 384,
	height: number = 450
): DialogWindow<BranchDialogComponent> {
	return windowService.create<BranchDialogComponent>(
		BranchDialogComponent,
		{
			width: width,
			height: height,
			modal: true,
			draggable: false,
			resizable: false,
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
	templateUrl: './branch-dialog.component.html',
	styleUrls: ['./branch-dialog.component.css']
})

export class BranchDialogComponent implements OnInit, OnDestroy{

    @Output('submit') submit = new EventEmitter<void>();
	  @Output('close') close = new EventEmitter<void>();

	  public _subs: Rx.Subscription[] = [];

    constructor(
		public _changeDetector: ChangeDetectorRef,
		public _elementRef: ElementRef,
		public _windowService: WindowService
	) { }

	ngOnInit() {
	}

    openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this._windowService, 'su.d.114');
		feedbackWindow.open();
	}

	onAdd() {
		this.submit.emit();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

  ngOnDestroy() {
  }
}
