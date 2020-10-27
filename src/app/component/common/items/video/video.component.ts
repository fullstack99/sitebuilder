// import {
//	 Component,
//	 Input,
//	 Output,
//	 HostBinding,
//	 ElementRef,
//	 Renderer,
//	 OnInit,
//	 AfterViewInit,
//	 OnChanges,
//	 OnDestroy,
//	 ViewChild,
//	 SimpleChanges
// } from '@angular/core';
// import {
//	 DomSanitizer,
//	 SafeStyle,
//	 SafeResourceUrl
// } from '@angular/platform-browser';
// import { Maybe } from '@app-lib/maybe/maybe';
// import { getVideoFrame } from '@app/shared/utils/video/video-frame';
// import { Item, CommonItemContent, VideoInfo, ImagePath } from '@app/models';

// @Component({
//	 moduleId: module.id,
//	 selector: 'video-item',
//	 templateUrl: './video.component.html',
//	 styleUrls: ['./video.component.css']
// })
// export class VideoComponent
//	 implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//	 @Input()
//	 item: Item;
//	 @Input()
//	 editable = false;
//	 @Input()
//	 selected = false;
//	 @Input()
//	 loading: boolean = false;

//	 @ViewChild('result')
//	 public _result: ElementRef;
//	 @ViewChild('placeImage')
//	 public _placeImage: ElementRef;
//	 @ViewChild('placeHolder')
//	 public _placeHolder: ElementRef;

//	 public info: Maybe<VideoInfo>;
//	 public backgrounds = [
//		 '/assets/images/canvas/video-save.png',
//		 '/assets/images/canvas/yt-save.png',
//		 '/assets/images/canvas/vimeo-save.png'
//	 ];

//	 public background: ImagePath;
//	 public videoEle: HTMLVideoElement;
//	 public viewInited: boolean;

//	 constructor(
//		 private elementRef: ElementRef,
//		 private renderer: Renderer,
//		 private sanitizer: DomSanitizer
//	 ) {}

//	 ngOnInit() {
//		 this.info = (this.item.content as CommonItemContent<VideoInfo>).info;
//		 if (this.info.hasValue()) {
//			 if (this.info.get().type == 1)
//				 //video
//				 this.setVideoResult();
//			 else this.setFrameResult();
//			 (this.elementRef.nativeElement as HTMLElement).style.opacity =
//				 '' + this.info.value.opacity / 100;
//		 }
//	 }

//	 ngAfterViewInit() {
//		 this.viewInited = true;
//	 }

//	 ngOnChanges(changes: SimpleChanges) {}

//	 setFrameResult() {
//		 let resultEle: HTMLElement = this._result.nativeElement as HTMLElement;
//		 let ele: HTMLIFrameElement = document.createElement(
//			 'iframe'
//		 ) as HTMLIFrameElement;
//		 const url = (this.item.content as CommonItemContent<VideoInfo>).info.get()
//			 .url;
//		 const vIds = url.split('/');

//		 if (this.info.value.type == 2) {
//			 this.background = {
//				 location: 'https://img.youtube.com/vi/' + vIds[vIds.length - 1],
//				 name: 'default.jpg'
//			 };
//		 }

//		 ele.src = (this.item.content as CommonItemContent<
//			 VideoInfo
//		 >).info.get().url;
//		 // ele.src = 'https://player.vimeo.com/video/78675881';
//		 ele.style.setProperty('width', '100%');
//		 ele.style.setProperty('height', '100%');
//		 resultEle.appendChild(ele);
//	 }

//	 setVideoResult() {
//		 let resultEle: HTMLElement = this._result.nativeElement as HTMLElement;
//		 this.videoEle = document.createElement('Video') as HTMLVideoElement;
//		 this.videoEle.crossOrigin = 'anonymous';
//		 this.videoEle.src = (this.item.content as CommonItemContent<
//			 VideoInfo
//		 >).info.get().url;
//		 this.videoEle.load();

//		 switch (
//			 (this.item.content as CommonItemContent<VideoInfo>).info.get().playMode
//		 ) {
//			 case 'looping':
//				 this.videoEle.loop = true;
//				 this.videoEle.autoplay = true;
//				 break;
//			 case 'auto':
//				 this.videoEle.loop = false;
//				 this.videoEle.autoplay = true;
//				 break;
//			 default:
//				 this.videoEle.loop = false;
//				 this.videoEle.autoplay = false;
//		 }

//		 switch (
//			 (this.item.content as CommonItemContent<VideoInfo>).info.get()
//				 .showControls
//		 ) {
//			 case 'always':
//				 this.videoEle.controls = true;
//				 this.videoEle.onmouseenter = () => {
//					 this.videoEle.controls = true;
//				 };
//				 this.videoEle.onmouseleave = () => {
//					 this.videoEle.controls = true;
//				 };
//				 break;
//			 case 'hover':
//				 this.videoEle.onmouseenter = () => {
//					 this.videoEle.controls = true;
//				 };
//				 this.videoEle.onmouseleave = () => {
//					 this.videoEle.controls = false;
//				 };
//				 break;
//			 default:
//				 if (this.isMobile() == 'iOS') {
//					 this.videoEle.controls = true;
//					 break;
//				 }
//				 this.videoEle.removeAttribute('controls');
//				 this.videoEle.onmouseenter = () => {
//					 this.videoEle.controls = false;
//				 };
//				 this.videoEle.onmouseleave = () => {
//					 this.videoEle.controls = false;
//				 };
//		 }
//		 this.videoEle.style.setProperty('width', '100%');
//		 this.videoEle.style.setProperty('height', '100%');
//		 this.videoEle.style.setProperty('left', '0px');
//		 this.videoEle.style.setProperty('top', '0px');
//		 this.videoEle.style.setProperty('object-fit', 'fill');
//		 this.videoEle.muted = true;
//		 this.videoEle.preload = 'none';
//		 resultEle.appendChild(this.videoEle);

//		 this.videoEle.addEventListener('loadeddata', () => {
//			 if (
//				 ['looping', 'auto'].indexOf(
//					 (this.item.content as CommonItemContent<VideoInfo>).info.get()
//						 .playMode
//				 ) >= 0
//			 ) {
//				 let played = this.videoEle.play();
//				 played.catch(err => {});
//			 }
//			 getVideoFrame(this.videoEle, this.videoEle.videoWidth, this.videoEle.videoHeight, (e) => {
//				 this.info.value.thumbnail = e;
//			 });
//			 // this.getThumbFromVideo();
//		 });
//	 }

//	 getThumbFromVideo() {
//		 if (!this.videoEle) return;
//		 if (!this.info.value.thumbnail) {
//			 let canvas = document.createElement('canvas');
//			 let context = canvas.getContext('2d');
//			 let w = this.videoEle.videoWidth;
//			 let h = this.videoEle.videoHeight;
//			 canvas.width = w;
//			 canvas.height = h;
//			 context.fillRect(0, 0, w, h);
//			 context.drawImage(this.videoEle, 0, 0, w, h);
//			 canvas.style.width = '100%';
//			 canvas.style.height = '100%';
//			 canvas.style.position = 'absolute';
//			 canvas.style.top = '0px';
//			 canvas.style.left = '0px';
//			 canvas.style.zIndex = '-100';
//			 (this._result.nativeElement as HTMLElement).appendChild(canvas);

//			 const intervals = setInterval(() => {
//				 if (this.viewInited) {
//					 let img = canvas.toDataURL('image/png');
//					 if (img && img.length > 50) {
//						 this.info.value.thumbnail = img;
//						 (this._result.nativeElement as HTMLElement).removeChild(canvas);
//						 clearInterval(intervals);
//					 }
//				 } else {
//					 clearInterval(intervals);
//				 }
//			 }, 2000);
//		 }
//	 }

//	 backgroundImage() {
//		 if (this.info.value.type == 1) {
//			 if (this._placeImage && this.info.value.thumbnail) {
//				 (this._placeImage
//					 .nativeElement as HTMLImageElement).src = this.info.value.thumbnail;
//			 }
//			 return '';
//		 } else if (this.info.value.thumbnail) {
//			 return this.sanitizer.bypassSecurityTrustStyle(
//				 `url('${this.info.value.thumbnail}')`
//			 );
//		 }
//	 }

//	 isMobile() {
//		 if (navigator.userAgent.match(/Android/i)) return 'Android';
//		 if (navigator.userAgent.match(/BlackBerry/i)) return 'BlackBerry';
//		 if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) return 'iOS';
//		 if (navigator.userAgent.match(/Opera Mini/i)) return 'Opera';
//		 if (navigator.userAgent.match(/IEMobile/i)) return 'Windows';
//		 return null;
//	 }

//	 ngOnDestroy() {
//		 this.viewInited = false;
//	 }
// }


import {
	Component,
	Input,
	Output,
	HostBinding,
	ElementRef,
	Renderer,
	OnInit,
	AfterViewInit,
	OnChanges,
	OnDestroy,
	ViewChild,
	SimpleChanges
} from '@angular/core';
import {
	DomSanitizer,
	SafeStyle,
	SafeResourceUrl
} from '@angular/platform-browser';
import { Maybe } from '@app-lib/maybe/maybe';
import { getVideoFrame } from '@app/shared/utils/video/video-frame';
import { Item, CommonItemContent, VideoInfo, ImagePath } from '@app/models';
declare var videojs: any;
@Component({
	moduleId: module.id,
	selector: 'video-item',
	templateUrl: './video.component.html',
	styleUrls: ['./video.component.css']
})
export class VideoComponent
	implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input() item: Item;
	@Input() editable = false;
	@Input() selected = false;
	@Input() loading: boolean = false;

	@ViewChild('result') public _result: ElementRef;
	@ViewChild('placeImage') public _placeImage: ElementRef;
	@ViewChild('placeHolder') public _placeHolder: ElementRef;

	public info: VideoInfo;
	public backgrounds = [
		'/assets/images/canvas/video-save.png',
		'/assets/images/canvas/yt-save.png',
		'/assets/images/canvas/vimeo-save.png'
	];

	public background: ImagePath;
	public videoEle: HTMLVideoElement;

	// Titulo do component
	title = 'Glogood Video';
	// Instancia do video.js.
	vidObj: any;
	// Poster para ser usado no video.js
	poster: any = '/assets/images/canvas/glogood-video.png';
	// Acessa o elemento video do html5 via viewchild.
	@ViewChild('myvid') vid: ElementRef;

	public viewInited: boolean;

	constructor(
		private elementRef: ElementRef,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		this.info = (this.item.content as CommonItemContent<VideoInfo>).info.getDef(null);
		if (this.info) {
			(this.elementRef.nativeElement as HTMLElement).style.opacity = '' + this.info.opacity / 100;
			if (this.info.url && this.info.type === 2) {
				const vIds = this.info.url.split('/');
				this.background = {
					location: 'https://img.youtube.com/vi/' + vIds[vIds.length - 1],
					name: 'default.jpg'
				};
			}
		}
	}

	ngAfterViewInit() {
		if (this.info && this.info.url && this.info.type === 1) {
			const options = {
				controls: this.info.showControls !== 'never',
				autoplay: this.info.playMode === 'auto' || this.info.showControls === 'never',
				preload: 'auto',
				techOrder: ['html5'],
				loop: this.info.playMode === 'looping',
				inactivityTimeout: this.info.showControls == 'always' ? 0 : 100,
			};

			this.vidObj = new videojs(this.vid.nativeElement, options, function onPlayerReady() {
				videojs.log('video is ready!');
			});

			this.vid.nativeElement.addEventListener('loadeddata', () => {
				getVideoFrame(this.vid.nativeElement, this.vid.nativeElement.videoWidth, this.vid.nativeElement.videoHeight, (e) => {
					this.info.thumbnail = e;
					this.poster = this.info.thumbnail;
					let posterEle = (this._result.nativeElement as HTMLElement).getElementsByClassName('vjs-poster');
					if (posterEle && posterEle.length > 0)
						(posterEle.item(0) as HTMLElement).style.backgroundImage = `url(${this.info.thumbnail})`;
				});
			});
		}
		this.viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {}


	backgroundImage() {
		if (this.info.type === 1) {
			if (this._placeImage && this.info.thumbnail) {
				(this._placeImage
					.nativeElement as HTMLImageElement).src = this.info.thumbnail;
			}
			return '';
		} else if (this.info.thumbnail) {
			return this.sanitizer.bypassSecurityTrustStyle(
				`url('${this.info.thumbnail}')`
			);
		}
	}

	isMobile() {
		if (navigator.userAgent.match(/Android/i)) return 'Android';
		if (navigator.userAgent.match(/BlackBerry/i)) return 'BlackBerry';
		if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) return 'iOS';
		if (navigator.userAgent.match(/Opera Mini/i)) return 'Opera';
		if (navigator.userAgent.match(/IEMobile/i)) return 'Windows';
		return null;
	}

	transformUrl(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	ngOnDestroy() {
		if (this.vid) {
			(this.vid.nativeElement as HTMLElement).parentElement.removeChild(this.vid.nativeElement);
		}
		this.viewInited = false;
	}
}

