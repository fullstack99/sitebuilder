import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, HostListener } from "@angular/core";
import { YouTubeInfo, VimeoInfo } from "@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-info";
import { YouTubeSearchState } from "@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-search-state.service";
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { VideoDetailComponent, createVideoDetailDialogWindow } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/video-detail/video-detail.component';

@Component({
	moduleId: module.id,
	selector: 'video-list-item',
	templateUrl: 'video-list-item.component.html',
	styleUrls: ['video-list-item.component.css']
})
export class VideoListItemComponent implements OnChanges {
	@Input('source') source: number = 2;
	@Input('video') video: YouTubeInfo | VimeoInfo;

	@Output('selectedVideo') selectedVideo = new EventEmitter<YouTubeInfo | VimeoInfo>();
	@Output('dbSelectedVideo') dbSelectedVideo = new EventEmitter<YouTubeInfo | VimeoInfo>();

	public _videoDetailDialog: DialogWindow<VideoDetailComponent>;

	constructor(
			public searchState: YouTubeSearchState,
			public _windowService: WindowService,
			public _changeDetector: ChangeDetectorRef) { }

	ngOnChanges(changes: SimpleChanges) {
		this._changeDetector.detectChanges();
	}

  	onClick() {
		this.selectedVideo.emit(this.video);
  	}

	onPlay(event: MouseEvent) {
		event.stopPropagation();
		this._videoDetailDialog = createVideoDetailDialogWindow(this._windowService, this.video, this.source);		
		this._videoDetailDialog.componentRef.instance.close.subscribe(() => {
			this._videoDetailDialog.destroy();
		})
		this._videoDetailDialog.open();		
	}

	@HostListener('dblclick', ['$event'])
	onDblClick(event: MouseEvent) {
		this.dbSelectedVideo.emit(this.video);
	}
}
