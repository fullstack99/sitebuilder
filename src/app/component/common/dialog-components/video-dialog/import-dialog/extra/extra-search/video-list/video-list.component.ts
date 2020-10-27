import { Component, ViewChild, ElementRef, OnInit, OnChanges, ChangeDetectorRef, Input, Output, EventEmitter, SimpleChanges } from "@angular/core";
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as moment from 'moment';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { Store } from '@ngrx/store';
import { ExtraAPI } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-search.service';
import { YouTubeInfo, VimeoInfo } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-info';
import * as youtubeReducer from '@app/stores/reducers/videos/youtube.reducer';

@Component({
	moduleId: module.id,
	selector: 'video-list',
	templateUrl: 'video-list.component.html',
	styleUrls: ['video-list.component.css']
})

export class VideoListComponent implements OnInit, OnChanges {
	@Input() refresh: number = 0;
	@Input() source: number = 2; //2: youtube, 3: vimeo
	@Input() query: string = '';
	@Input() fromAccount: boolean = false;
	@Input() maxNum: number = 8;

	@Output() selectedVideo = new EventEmitter<YouTubeInfo | VimeoInfo>();
	@Output() dbSelectedVideo = new EventEmitter<YouTubeInfo | VimeoInfo>();

	@ViewChild('videosContainer') public _videosContainer: ElementRef;

	public _catchQuery = new Rx.Subject<string>();
	public _videosContainerScroll = new Rx.Subject<void>();
	public _youTubeVideos: YouTubeInfo[];
	public _vimeoVideos: VimeoInfo[];

	public _searchResult: any;
	public _loading: boolean = false;
	public activeVideo: YouTubeInfo | VimeoInfo;

	private youtubeUser: youtubeReducer.YoutubeUserProfileState;
	private subs: Rx.Subscription[] = [];

	constructor(
		private store:Store<youtubeReducer.YoutubeUserProfileState>,
		private changeDetector: ChangeDetectorRef,
		public extraAPI: ExtraAPI
		) { }

	ngOnInit() {
		this.subs = [
			this.store.select(youtubeReducer.getUser)
				.subscribe((data) => {
					if (data) {
						this.youtubeUser = data;
					}
					else {
						this.youtubeUser = undefined;
					}
				}),
			this._catchQuery.subscribe(s => {
				switch (this.source) {
					case 2: // YouTube
						if (!this.fromAccount)
							this.searchYouTube(s);
						else
							this.searchYouTubeFromAccount(s);
						break;

					case 3: // Vimeo
						if (!this.fromAccount)
							this.searchVimeo(s);
						else
							this.searchVimeoFromAccount(s);
						break;
				}
			}),

			this._videosContainerScroll.subscribe(() => {
				const el = this._videosContainer.nativeElement as HTMLElement;
				if (el.scrollHeight - el.offsetHeight - el.scrollTop <= 0) {
					switch (this.source) {
						case 2: // YouTube
							if (!this.fromAccount)
								this.searchYouTube(this.query, this._searchResult.nextPageToken, true);
							else
								this.searchYouTubeFromAccount(this.query, this._searchResult.nextPageToken, true);
							break;

						case 3: // Vimeo
							if (!this.fromAccount)
								this.searchVimeo(this.query, this._searchResult.page + 1, true);
							else
								this.searchVimeoFromAccount(this.query, this._searchResult.page + 1, true);
							break;
					}
				}
			})
		];
	}

	ngOnChanges(changes: SimpleChanges) {
		let query = '';
		if (this.query != '')
			query = this.query;

		this._catchQuery.next(query);
	}

	searchYouTube(query: string = '', nextPageToken: string = '', scroll: boolean = false) {
		this._loading = true;
		this.changeDetector.detectChanges();

		this.getYouTubeVideos(query, nextPageToken).subscribe(result => {
			if (!(result.length == 1 && result[0] == 'error')) {
				this._searchResult = result;
				let videoList: YouTubeInfo[] = this._searchResult.items.map((item: any) => {
					return new YouTubeInfo(
						item.id.videoId,
						item.snippet.title,
						item.snippet.thumbnails.high.url,
						item.snippet.channelTitle,
						item.snippet.channelId,
						moment(item.snippet.publishedAt).fromNow(),
						item.snippet.description);
				});

				if (scroll)
					this._youTubeVideos = this._youTubeVideos.concat(videoList);
				else
					this._youTubeVideos = videoList;
			}
			else {
				// this.errorHandle();
			}

			this._loading = false;
			this.changeDetector.detectChanges();
		});
	}

	searchVimeo(query: string = '', nextPage: number = 1, scroll: boolean = false) {
		this._loading = true;
		this.changeDetector.detectChanges();
		this.getVimeoVideos(query, nextPage).subscribe(result => {
			if (!(result.length == 1 && result[0] == 'error')) {
				this._searchResult = result;
				let videoList: VimeoInfo[] = result.data.map((item: any) => {
					return new VimeoInfo(
						item.uri,
						item.name,
						item.link,
						item.pictures[0].link,
						item.duration,
						moment(item.modified_time).fromNow(),
						item.embed.html,
						item.description);
				});

				if (scroll)
					this._vimeoVideos = this._vimeoVideos.concat(videoList);
				else
					this._vimeoVideos = videoList;
			}
			else {
				// this.errorHandle();
			}

			this._loading = false;
			this.changeDetector.detectChanges();
		});
	}

	searchYouTubeFromAccount(query: string = '', nextPageToken: string = '', scroll: boolean = false) {

	}

	searchVimeoFromAccount(query: string = '', nextPage: number = 1, scroll: boolean = false) {

	}

	getYouTubeVideos(query: string = '', pageToken: string = ''): Rx.Observable<any> {
		return this.extraAPI.youTubeSearch(query, pageToken, this.maxNum);
	}

	getVimeoVideos(query: string = '', pageNum: number = 1): Rx.Observable<any> {
		return this.extraAPI.vimeoSearch(query, this.maxNum, pageNum);
	}

	getYouTubeVideosFromAccount(query: string = '', pageToken: string = ''): Rx.Observable<any> {
		return this.extraAPI.youTubeSearch(query, pageToken, this.maxNum);
	}

	getVimeoVideosFromAccount(query: string = '', pageNum: number = 1): Rx.Observable<any> {
		return Rx.Observable.of([]);
	}

	selectVideo(event: YouTubeInfo) {
		this.activeVideo = event;
		this.selectedVideo.emit(event);
		this.changeDetector.detectChanges();
	}

	dbSelectVideo(event: YouTubeInfo) {
		this.dbSelectedVideo.emit(event);
	}
}
