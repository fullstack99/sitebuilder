import {
	Component, Input, Output, EventEmitter, OnInit, ElementRef, ChangeDetectorRef, ViewChild, OnDestroy
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { AttentionInfo, DispStr } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { AttentionInfo, DispStr } from '@app/models';

export function createAttentionDialogWindow(
	windowService: WindowService,	
	attention_info: AttentionInfo
): DialogWindow<AttentionDialogComponent> {
	return windowService.create<AttentionDialogComponent>(
		AttentionDialogComponent,
		{
			width: 300,
			position: {
				left: 'calc(50% - 150px)',
				top: 'calc(30%)'
			},
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {		
		comp.attention_info = attention_info;		
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'attention-dialog.component.html',
	styleUrls: ['attention-dialog.component.css']
})
export class AttentionDialogComponent implements OnInit, OnDestroy {

	@Input('attention_info') attention_info: AttentionInfo;	
	@Output('submit') submit = new EventEmitter<boolean>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('title') title: ElementRef;
	@ViewChild('resultContent') resultContent: ElementRef;	
	
	constructor(
		private _changeDetector: ChangeDetectorRef,		
		private _windowService: WindowService,
		private _sanitizer: DomSanitizer
	) { }

	ngOnInit() {		
		let ele: HTMLElement;		
		
		((this.title.nativeElement) as HTMLElement).style.setProperty('font-size', this.attention_info.title.font_size);
		((this.title.nativeElement) as HTMLElement).style.setProperty('color', this.attention_info.title.color);

		this.attention_info.content.forEach((s) => {
			ele = document.createElement('div') as HTMLElement;
			ele.setAttribute('class', 'center-block text-center');
			ele.style.setProperty('padding', '5 0 5 0px');
			ele.style.setProperty('font-size', s.font_size);
			ele.style.setProperty('color', s.color);
			ele.innerHTML = s.value;
			((this.resultContent.nativeElement) as HTMLElement).appendChild(ele);
		});		
	}

	onMouseDownDialog(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
	}

	openFeedbackDialog(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		let feedabckWindow = createFeedbackDialogWindow(this._windowService, this.attention_info.feedback_code);		
		feedabckWindow.open();
	}

	onProceed(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.submit.next(true);
	}
	onStop(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();		
		this.submit.next(false);
	}

	onClose(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.close.next();
	}

	ngOnDestroy() {		
	}
}