import { Component, Input, Output, OnInit, OnChanges, EventEmitter, SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { YouTubeInfo, VimeoInfo } from "@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-info";
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createVideoDetailDialogWindow(
	windowService: WindowService,
	video: YouTubeInfo | VimeoInfo,
	source: number = 2

): DialogWindow<VideoDetailComponent> {
	return windowService.create<VideoDetailComponent>(
		VideoDetailComponent,
		{
			width: 590,
			height: 380,
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.source = source;
		comp.video = video;
		comp.close.subscribe(() => window.close());		
	});
}

@Component({
	moduleId: module.id,
	selector: 'video-detail',
	templateUrl: 'video-detail.component.html',
	styleUrls: ['video-detail.component.css']
})
export class VideoDetailComponent {
	@Input('source') source: number = 2; //2: youtube, 3: vimeo
	@Input() video: YouTubeInfo | VimeoInfo;
	@Output('close') close = new EventEmitter<void>();
	@ViewChild('result') public _result: ElementRef;

	constructor(		
		public _changeDetector: ChangeDetectorRef,
		public _sanitizer: DomSanitizer) { }

	
	getHTML(text: string): SafeHtml {
		return (this._sanitizer.bypassSecurityTrustHtml(text));		
	}

	onClose(event: Event) {
		this.close.emit();
	}
}
