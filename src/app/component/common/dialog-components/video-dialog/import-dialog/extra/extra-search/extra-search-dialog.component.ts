import { Component, Output, EventEmitter, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, Input
	   } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { YouTubeInfo, VimeoInfo } from "@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-info";
import { WindowService, DialogWindow } from '@app-common/window/window.service';


/** */
export function createExtraSearchDialogWindow(
	windowService: WindowService,
	source: number = 2, // 2: Youtube, 3: Vimeo
	fromAccount: boolean = false,
	feedbackcode: string = ''	
): DialogWindow<ExtraSearchDialogComponent> {
	return windowService.create<ExtraSearchDialogComponent>(
		ExtraSearchDialogComponent,
		{
			width: 1024,
			height: 610,
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.source = source;
		comp.fromAccount = fromAccount;
		comp.feedbackcode = feedbackcode;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'extra-search-dialog.component.html',
	styleUrls: ['extra-search-dialog.component.css']
})
export class ExtraSearchDialogComponent implements OnInit, AfterViewInit, OnDestroy {	
		
	@Input() source: number = 2; // 2: youtube, 3: vimeo
	@Input() fromAccount: boolean = false;
	@Input() feedbackcode: string = '';   

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<string>();

	public selectedVideo: YouTubeInfo | VimeoInfo;
	public results: Rx.Observable<any>;	
	public search = new FormControl('');
	public refresh: number = 0;	

	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,		
		private sanitizer: DomSanitizer		
	) {}

	ngOnInit() {
		
	}

	ngAfterViewInit() {
		this.searchVideo();
	}

	onKeypress(event: KeyboardEvent) {
		if (event.keyCode != 13) return;
		event.stopPropagation();
		this.searchVideo();
	}

	searchVideo() {
		this.refresh = this.refresh == 0 ? 1 : 0;
		this.changeDetector.detectChanges();
	}

	selectVideo(video: any) {		
		this.selectedVideo=video;
	}

	dbSelectVideo(video: YouTubeInfo | VimeoInfo) {
		this.onAdd();
	}

	onAdd() {
		if (!this.selectedVideo) return;
		switch (this.source) {
			case 2:
				if ((this.selectedVideo as YouTubeInfo).videoId)
					this.submit.emit((this.selectedVideo as YouTubeInfo).videoId);
				break;
			case 3:
				if ((this.selectedVideo as VimeoInfo).uri)
					this.submit.emit((this.selectedVideo as VimeoInfo).uri);
				break;		   
		}		
	}

	onClose() {
		this.close.emit();
	}   

	ngOnDestroy() {			  
	}
}
