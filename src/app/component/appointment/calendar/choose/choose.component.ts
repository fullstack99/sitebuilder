import { Component, ChangeDetectorRef, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createChooseWindow(
	windowService: WindowService,
	chooseOption: number = 1
): DialogWindow<ChooseComponent> {
	return windowService.create<ChooseComponent>(
			ChooseComponent,
				{            
					width: 200,
					position: {
						left: 'calc(50% - 100px)',
						top: '50px'
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
		comp.chooseOption = chooseOption;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
  selector: 'app-choose',
  templateUrl: './choose.component.html',
  styleUrls: ['./choose.component.css']
})

export class ChooseComponent implements OnInit, OnDestroy {
		
	@Input() chooseOption: number = 2;

	@Output() submit = new EventEmitter<number>();
	@Output() close = new EventEmitter<void>();

	chooseOptionControl: FormControl;
	private subs: Rx.Subscription[] = [];

	constructor(		
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private windowService: WindowService	
	) { }

	ngOnInit() {
		this.chooseOptionControl = new FormControl(this.chooseOption);
		console.log(this.chooseOptionControl.value);
		this.subs = [
			this.chooseOptionControl.valueChanges.subscribe(res => {
				if (res != this.chooseOption)
					this.close.emit(res);
			})
		]
	}

	openFeedbackDialog() {		
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');		
		feedbackWindow.open();
	}

	onSubmit() {
		this.submit.emit(this.chooseOptionControl.value);
	}

	onClose() {
		this.close.emit();
	}	

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}

