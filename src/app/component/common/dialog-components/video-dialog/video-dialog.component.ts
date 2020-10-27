import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnInit,
	ChangeDetectorRef,
	OnDestroy,
	ElementRef,
	ViewChild,
	AfterViewInit,
	forwardRef,
	HostListener
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	Validators
} from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import {
	get as _get
} from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import * as imageUrl from '@app-lib/functions/image-url';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createVideoImportDialogWindow } from './import-dialog/video-import-dialog.component';
import { createExtraImportDialogWindow } from './import-dialog/extra/extra-import-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';

import { VideoInfo, Category, WSDetail, CommonItemContent } from '@app/models';

import { Video, VideoService } from './video.service';
import { EditorService } from '@app-dialogs/image-editor/editor/editor.service';
import { WSService, AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { environment } from '@app-environments/environment';

declare var videojs: any;

const TOOLS: AviaryNS.FeatherTools[] = ['crop', 'resize'];

export function createVideoDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<VideoInfo>
): DialogWindow<VideoDialogComponent> {
	return windowService
		.create<VideoDialogComponent>(VideoDialogComponent, {
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
		})
		.changeInputs((comp, window) => {
			comp.itemContent = itemContent;
			comp.submit.subscribe(() => window.close());
			comp.close.subscribe(() => window.close());
		});
}

@Component({
	moduleId: module.id,
	templateUrl: './video-dialog.component.html',
	styleUrls: ['./video-dialog.component.css']
})
export class VideoDialogComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() itemContent: CommonItemContent<VideoInfo> = new CommonItemContent<VideoInfo>(
		Maybe.just(VideoInfo.empty())
	);

	@Output() submit = new EventEmitter<CommonItemContent<VideoInfo>>();
	@Output() close = new EventEmitter<void>();
	@Output() newImageUrl = new EventEmitter<string>();

	@ViewChild('videoEle') videoEle: ElementRef;
	@ViewChild('resultVideo') resultVideo: ElementRef;
	@ViewChild('resultFrame') resultFrame: ElementRef;
	@ViewChild('resultSpan') resultSpan: ElementRef;
	@ViewChild('videosContainer') public _imagesContainer: ElementRef;
	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;

	public _elem: HTMLElement;
	public info: VideoInfo = VideoInfo.empty();
	public _videos: any = [];

	public _selectTab = new Rx.Subject<WSDetail>();
	public _videosContainerScroll = new Rx.Subject<void>();
	public _catchCategory = new Rx.Subject<Category>();
	public _loading: boolean = false;
	public _loadingText: string = 'Uploading...';

	public tabs: WSDetail[] = [
		{ id: 1, name: 'Videos' },
		{ id: 2, name: 'YouTube' },
		{ id: 3, name: 'Vimeo' }
	];
	public activeTab: WSDetail = this.tabs[0];
	public form: FormGroup;
	public adjustItem: string = 'showControls';

	_selectedCategory: Category = null;
	_videoCategories: Category[] = [];
	showCategoryValue = (c: Category) => (c ? c.description : '');

	// Titulo do component
	title = 'Glogood Video';
	vidObj: any;
	poster = '/assets/images/canvas/glogood-video.png';

	private _editor = Maybe.nothing<AviaryNS.Feather>();
	private callingAPI: Rx.Subscription;
	private feedbackCode = ['ca.v.140', 'ca.v 141'];
	private subs: Rx.Subscription[] = [];

	constructor(
		private fb: FormBuilder,
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private windowService: WindowService,
		private videoService: VideoService,
		private editorService: EditorService,
		private alertService: AlertService,
		private wsService: WSService,
		private appService: AppService
	) {
		this.form = fb.group({
			type: [1, [Validators.required]], // 1: video, 2: youtybe, 3: vimeo
			url: ['', [Validators.required]],
			videoId: [''],
			thumbnail: [null],
			showControls: ['always', [Validators.required]],
			playMode: ['', [Validators.required]],
			opacity: [100, [Validators.required, Validators.max(1)]]
		});
	}

	ngOnInit() {
		this.info = this.itemContent.info.get();
		this._elem = this.elementRef.nativeElement;

		this.form.patchValue({
			type: this.info.type,
			url: this.info.url,
			videoId: this.info.videoId,
			thumbnail: this.info.thumbnail,
			showControls: this.info.showControls,
			playMode: this.info.playMode,
			opacity: this.info.opacity
		});

		const initialVideos = this._catchCategory
			.map(s => {
				this._selectedCategory = s;
				return this.getVideos(0, 9);
			})
			.switch()
			.publish()
			.refCount();

		const moreVideos = this._videosContainerScroll
			.map(() => {
				const el = this._imagesContainer.nativeElement as HTMLElement;
				return el.scrollHeight - el.offsetHeight - el.scrollTop;
			})
			.filter(scrollBottom => scrollBottom === 0)
			.map(() => this.getVideos(this._videos.length - 1, 9))
			.switch()
			.publish()
			.refCount();

		this.subs = [
			initialVideos.subscribe((r: any) => {
				this._videos = [];
				if (r && r.data) {
					r.data.forEach(r=> {
						const videoItems = r.items.filter(i => i.itemType == 'VideoItem');
						videoItems.forEach(ii => {
							this._videos.push(ii.content.info.value);
						})
					});
				}
				this.refreshView();
			}),

			// moreVideos.subscribe(r => {
			//   this._videos = [...this._videos, ...r];
			//   this.refreshView();
			// }),

			this._selectTab.subscribe(res => {
				this.activeTab = res;
				this.form.controls['type'].setValue(res.id);
			}),

			this.form.valueChanges.pipe().subscribe(res => {
				this.info.opacity = Math.floor(res['opacity']);
				this.refreshView();
				this.setResult();
			})
		];

		this.getCategories();
  	}

	ngAfterViewInit() {
		this.setResult();
	}

	// getCategories() {
	//   if (this._videoCategories.length <= 1) {
	//	 const categories = this.videoService.getCategories();
	//	 categories.subscribe(category => {
	//	   category.forEach(c => {
	//		 this._videoCategories = lodash.concat(
	//		   this._videoCategories,
	//		   c.description
	//		 );
	//	   });
	//	   this.refreshView();
	//	 });
	//   }
	// }

	getCategories() {
		const suid = environment.BackgroundVideo;
		const categories = this.wsService.getCategories(null, suid);
		categories.subscribe(
			(res: any) => {
				console.log(res);
				this._videoCategories = res;
				this._catchCategory.next(null);
			},
			error => {
				console.log('category', error);
			},
			() => {
			}
		);
	}

	openImportDialog(videoType: string = 'file') {
		let importDialog: any;
		if (this.activeTab.name == 'Videos') {
			importDialog = createVideoImportDialogWindow(
				this.windowService,
				videoType,
				this.feedbackCode[1]
			);
			importDialog.componentRef.instance.submit.subscribe(res => {
				this.info = res;
				importDialog.destroy();
				if (res) {
					if (res.type == 1) {
						// video
						this.setVideoResult(res.url);
					} else if (res.type == 2) {
						// youtube
						this.setYouTubeResult(res.videoId);
					} else {
						// vimeo
						this.setVimeoResult(res.url);
					}
				}
				this.refreshView();
			});
		} else if (this.activeTab.name == 'YouTube') {
			importDialog = createExtraImportDialogWindow(
				this.windowService,
				'ca.v 142',
				2
			);
			importDialog.componentRef.instance.submit.subscribe(videoId => {
				importDialog.destroy();
				this.setThumbnail('http://i.ytimg.com/vi/' + videoId + '/default.jpg');
				this.form.controls['videoId'].setValue(videoId, { emitEvent: false });
			});
		} else {
			importDialog = createExtraImportDialogWindow(
				this.windowService,
				'ca.v 142',
				3
			);
			importDialog.componentRef.instance.submit.subscribe(url => {
				importDialog.destroy();
				this.form.controls['url'].setValue(url);
			});
		}

		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});
		importDialog.open();
	}

	setThumbnail(url: string) {
		let img = new Image();
		img.src = url;
		let mImageElem = Maybe.just(img);
		this.refreshView(true, 'Loading...');
		try {
		mImageElem.map(imageElem => {
			this.editorService.getEditor().then(
			editor => {
				this._editor = Maybe.just(editor);
				editor.launch({
				image: imageElem,
				appendTo: '_video_editor_container',
				// onError: e => console.log(e),
				theme: 'light',
				tools: TOOLS,
				onLoad: () => {},
				onReady: () => {
					setTimeout(() => {
					editor.save();
					// $('#avpw_save_button').click();
					}, 2000);
				},
				onClose: () => {},
				onSave: (imgID, newURL) => {
					let ele: any = document.getElementById('avpw_canvas_element');
					let imageFile = this.appService.dataURLtoFile(
							ele.toDataURL(),
							'aviary-' + UUID.UUID() + '.png'
						);
					this.callingAPI = this.appService
					.uploadImages([imageFile])
					.subscribe(
						event => {
						switch (event.type) {
							case HttpEventType.Sent:
								// console.log(`Uploading file '${index}' of size ${f.size}.`);
								break;
							case HttpEventType.UploadProgress:
								if (this.loadingComponent)
									this.loadingComponent.set(
									Math.min((event.loaded / event.total) * 100, 98)
									);
								break;
							case HttpEventType.Response:
								if (this.loadingComponent)
									this.loadingComponent.complete();
								if (event.body) {
									const s = event.body['urls'][0];
									this.form.controls['thumbnail'].setValue(imageUrl.imageSrcUrl(s));
								} else {
									this.refreshView();
								}
								if (editor) editor.close();
								break;
						}
						},
						error => {
							console.log(error);
							if (editor) editor.close();
							this.refreshView();
							this.alertService.playToast(
								'Failed',
								`There is an error while loading the video. Try again`,
								1
							);
						},
						() => {}
					);
					return false;
				}
				});
			},
			e => {
				this.refreshView();
			}
			);
		});
		} catch (e) {
		this.refreshView();
		}
	}

	getVideos(skip?: number, take?: number) {
		let suid = environment.BackgroundVideo;
		let uid = '';
		if (this._selectedCategory) {
			uid = this._selectedCategory.uid;
		} else if (this._videoCategories[0]) {
			uid = this._videoCategories[0].uid;
		}
		return this.wsService.getThemePage(uid, null, null, null, true, true, suid);
	}

	setDefaultVideo() {
		this.form.patchValue(
			{
				type: 1,
				url: '',
				videoId: '',
				thumbnail: ''
			},
		);
		this.setResultStyle(1);
	}

	setResult() {
		if (this.form.value['type'] === 1)
			this.setVideoResult(this.form.value['url']);
		else if (this.form.value['type'] === 2)
			this.setYouTubeResult(this.form.value['videoId']);
		else if (this.form.value['type'] === 3)
			this.setVimeoResult(this.form.value['url']);
	}

	setYouTubeResult(videoId: string) {
		let ele = this.resultFrame.nativeElement as HTMLIFrameElement;
		let src: string = '';

		this.form.patchValue(
			{
				url: 'http://www.youtube.com/embed/' + videoId,
				videoId: videoId
			},
			{ emitEvent: false }
		);

		switch (this.form.value.playMode) {
			case 'looping':
				src = src + '?playlist=' + videoId + '&loop=1';
				break;
			case 'auto':
				src = src + '?autoplay=1';
				break;
		}

		switch (this.form.value.showControls) {
			case 'always':
				if (src != '') src = src + '&controls=1';
				else src = '?controls=1';
				break;
			case 'hover':
				break;
			default:
				if (src != '') src = src + '&controls=0';
				else src = '?controls=0';
				break;
		}

		if (this.form.value['videoId']) {
			ele.src = this.form.value['url'] + src;
			this.setResultStyle(3);
		} else {
			this.setResultStyle(1);
		}
	}

	setVimeoResult(uri: string) {
		let ele = this.resultFrame.nativeElement as HTMLIFrameElement;
		let src: string = '';

		this.form.patchValue(
			{
				url: `https://player.vimeo.com/video/${uri.substr(8)}?title=0`,
				videoId: uri
			},
			{ emitEvent: false }
		);

		switch (this.form.value['playMode']) {
			case 'looping':
				src = src + '&loop=1';
				break;
			case 'auto':
				src = src + '&autoplay=1';
				break;
		}

		if (this.form.value['url']) {
			ele.src = this.form.value['url'] + src;
			this.setResultStyle(3);
		} else {
			this.setResultStyle(1);
		}
	}

	setVideoResult(video: string | Video) {
		const ele = this.resultVideo.nativeElement as HTMLVideoElement;

		if (typeof video == 'string')
			this.form.patchValue(
				{
					url: video,
					videoId: ''
				},
				{ emitEvent: false }
			);
		else
			this.form.patchValue(
				{
				url: video.location + '/' + video.name,
				videoId: ''
				},
				{ emitEvent: false }
			);

		switch (this.form.value.playMode) {
			case 'looping':
				ele.loop = true;
				ele.autoplay = true;
				break;
			case 'auto':
				ele.loop = false;
				ele.autoplay = true;
				break;
			default:
				ele.loop = false;
				ele.autoplay = false;
				break;
		}

		switch (this.form.value.showControls) {
			case 'always':
				ele.controls = true;
				$(ele).mouseenter(() => {
					ele.controls = true;
				});
				$(ele).mouseleave(() => {
					ele.controls = true;
				});
				break;
			case 'hover':
				$(ele).mouseenter(() => {
					ele.controls = true;
				});
				$(ele).mouseleave(() => {
					ele.controls = false;
				});
				break;
			default:
				ele.removeAttribute('controls');
				$(ele).mouseenter(() => {
					ele.controls = false;
				});
				$(ele).mouseleave(() => {
					ele.controls = false;
				});
		}

		// if (this.info && this.info.type == 1) {
		//   const options = {
		//	 controls: true,
		//	 autoplay: false,
		//	 preload: 'auto',
		//	 techOrder: ['html5']
		//   };

		//   this.vidObj = new videojs(this.resultVideo.nativeElement, options, function onPlayerReady() {
		//	 videojs.log('video is ready!');
		//   });
		// }

		if (this.form.value['url']) {
			ele.src = this.form.value['url'];
			this.setResultStyle(2);
		} else {
			this.setResultStyle(1);
		}
		this.refreshView();
	}

	setResultStyle(n: number) {
		let eleVideo = this.resultVideo.nativeElement as HTMLVideoElement;
		let eleFrame = this.resultFrame.nativeElement as HTMLElement;
		let eleSpan = this.resultSpan.nativeElement as HTMLElement;

		switch (n) {
			case 1:
				eleVideo.style.setProperty('display', 'none');
				eleFrame.style.setProperty('display', 'none');
				eleSpan.style.setProperty('display', 'block');
				break;
			case 2: // view video
				eleVideo.style.setProperty('display', 'block');
				eleFrame.style.setProperty('display', 'none');
				eleSpan.style.setProperty('display', 'none');
				break;
			case 3: // view frame
				eleVideo.style.setProperty('display', 'none');
				eleFrame.style.setProperty('display', 'block');
				eleSpan.style.setProperty('display', 'none');
		}
		(this.videoEle.nativeElement as HTMLElement).style.opacity = '' + this.info.opacity / 100;
	}

	selectAdjustItem(event: string) {
		this.adjustItem = event;
		this.refreshView();
	}

	onHoverButton(event: Event) {
		//(event.target as HTMLVideoElement).play();
	}

	onLeaveButton(event: Event) {
		//(event.target as HTMLVideoElement).pause();
	}

	onClose() {
		this.close.next();
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	onAdd() {
		this.info = this.form.value;
		this.itemContent = this.itemContent.setInfo(Maybe.just(this.info));
		this.submit.emit(this.itemContent);
	}

	refreshView(loading: boolean = false, text: string = 'Uploading...') {
		this._loading = loading;
		this._loadingText = text;
		this.changeDetector.detectChanges();
	}

	onDragOver(e) {
		e.preventDefault();
		this.videoEle.nativeElement.style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		this.videoEle.nativeElement.style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		this.videoEle.nativeElement.style.opacity = '1';
		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.indexOf('video') >= 0) {
			this.refreshView(true, 'Uploading...');
			this.callingAPI = this.appService.uploadImages([files[0]]).subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							// console.log(`Uploading file '${index}' of size ${f.size}.`);
							break;
						case HttpEventType.UploadProgress:
							// Compute and show the % done:
							break;
						case HttpEventType.Response:
							if (event.body) {
								const s = event.body['urls'][0];
								this.form.controls['thumbnail'].setValue(imageUrl.imageSrcUrl(s));
								this.refreshView();
								this.setVideoResult(s);
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.refreshView();
					// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
				},
				() => {}
			);
		}
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(
			this.windowService,
			this.feedbackCode[0]
		);
		feedbackWindow.componentRef.instance.close.subscribe(() => {
			feedbackWindow.destroy();
		});
		feedbackWindow.open();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}

	@HostListener('dragover', ['$event'])
	onEleDragOver(e) {
		e.preventDefault();
	}

	@HostListener('drop', ['$event'])
	onEleDrop(e) {
		e.preventDefault();
	}
}
