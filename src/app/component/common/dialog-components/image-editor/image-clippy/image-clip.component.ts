import { ViewChild, Component, ElementRef, ChangeDetectorRef, SimpleChanges, AfterViewInit,
	OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter
  } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as domtoimage from 'dom-to-image';
import * as html2canvas from "html2canvas";
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { ImagePath, ClipPath } from '@app/models';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';
import * as imageUrl from '@app-lib/functions/image-url';

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
	moduleId   : module.id,
	selector   : 'image-clip',
	templateUrl: './image-clip.component.html',
	styleUrls: [
		'./image-clip.component.css',
	]
})

export class ImageClipComponent implements OnInit, OnChanges, OnDestroy {

	@Input() image: ImagePath = null;

	@Output() placeOnPage = new EventEmitter<ImagePath>();
	@Output() close = new EventEmitter<void>();

	@ViewChild('clipbox') public _clipbox: ElementRef;
	get clipboxElem(): HTMLElement { return (this._clipbox.nativeElement as HTMLElement); }

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChild('shadowboard') public _shadowboard: ElementRef;
	@ViewChild('clipboard') public _clipboard: ElementRef;
	@ViewChild('clipboardPath') public _clipboardPath: ElementRef;
	@ViewChild('handles') public _handles: ElementRef;

	public clipPath: ClipPath = null;
	public _currentHandler: number = -1;
	public _totalHandlers: number = 0;
	public _loading: boolean = false;
	private pWidth: number = 2.8; // (300 - 20) / 100
	private pHeight: number = 2.8;
	private extra: number = 1;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		public elementRef: ElementRef,
		private sanitizer: DomSanitizer,
		private appService: AppService
	) { }

	ngOnInit() {
		if (this.image)
			this.setClipboxSize();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['image'] && changes['image'].currentValue)
			this.setClipboxSize();
	}

	setClipboxSize() {
		if (!this.image) return;
		if (this.clipPath && (this.clipPath.type == 'circle' || this.clipPath.type == 'ellipse')) {
			this.pHeight = 2.8;
			this.pWidth = 2.8;
		}
		else {
			let width = 880;
			let height = 480;
			let img = new Image;
			img.src = this.image.location + '/' + this.image.name;

			let imgHeight = img.height;
			let imgWidth = img.width;

			if ( imgWidth > width) {
				imgHeight = imgHeight * (width / imgWidth);
				imgWidth = width;
			}

			if (imgHeight > height) {
				imgWidth = imgWidth * (height / imgHeight);
				imgHeight = height;
			}

			this.pHeight = imgHeight / 100;
			this.pWidth = imgWidth / 100;
		}
	}

	onSetCommand(event: string) {
		this.changeDetector.detach();
		switch (event) {
			case 'PlaceOnPage':
				this.onSaveImage();
				break;
			case 'Back':
				this.close.emit();
		}
	}

	onSaveImage() {
		if (!this.image) return;
		$((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement).addClass('disable');
		this.extra = 1.07142857142;
		this.refreshView(true);
		this.cleanBox();
		setTimeout(() => {
			// html2canvas(this.clipboxElem, {
			//   allowTaint: false,
			//   useCORS: true,
			//   logging: false,
			//   imageTimeout: 0,
			//   backgroundColor: "#FFFFFF",
			//   // scale: scale
			// })
			//   .then(canvas => {
			//	 let dataImage = canvas.toDataURL("image/jpeg", 0.92); //image/png
			//	 // let dataImage = canvas.toDataURL('image/png'); //image/png
			//	 let imageFile = this.appService.dataURLtoFile(
			//	   dataImage,
			//	   this.image.name + '_clip_' + UUID.UUID() + '.png'
			//	 );
			domtoimage.toPng(this.clipboxElem)
				.then((dataURL: any) => {
					const imageFile = this.appService.dataURLtoFile(dataURL, decodeURIComponent(this.image.name) + '-clip' + UUID.UUID() + '.png');
					this.appService.uploadImages([imageFile]).subscribe(
						event => {
							switch (event.type) {
								case HttpEventType.Sent:
									// console.log(`Uploading file "${index}" of size ${f.size}.`);
									break;
								case HttpEventType.UploadProgress:
									if (this.loadingComponent)
										this.loadingComponent.set(Math.min(event.loaded / event.total * 100, 98));
									break;
								case HttpEventType.Response:
									if (this.loadingComponent)
										this.loadingComponent.complete();

									const tuid = lodash.get(event, 'body.tuid');
									const img = lodash.get(event, ['body', 'urls', 0]);

									if (tuid) {
									  	localStorage.setItem('tuid', lodash.get(event, 'body.tuid'));
									}
									if (img) {
										this.placeOnPage.emit(img as ImagePath);
									}
									break;
								// default:
								//	 console.log(`File "${index}" surprising upload event: ${event.type}.`);
							}
						},
						error => {
							console.log(error);
							$((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement).removeClass('disable');
							// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
						},
						() => {
							$((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement).removeClass('disable');
						}
					);
				})
				.catch((error: any) => {
					$((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement).removeClass('disable');
					this.restoreBox();
					console.error('oops, something went wrong!', error);
				});
		});
	}

	cleanBox() {
		(this._handles.nativeElement as HTMLElement).setAttribute('hidden', 'true');
		$(this._clipbox.nativeElement as HTMLElement).removeClass('box-shadow');
		$(this._clipboard.nativeElement as HTMLElement).removeClass('inside-10');
		$(this._shadowboard.nativeElement as HTMLElement).removeClass('inside-10');
	}

	restoreBox() {
		this.extra = 1;
		(this._handles.nativeElement as HTMLElement).removeAttribute('hidden');
		$(this._clipbox.nativeElement as HTMLElement).addClass('box-shadow');
		$(this._clipboard.nativeElement as HTMLElement).addClass('inside-10');
		$(this._shadowboard.nativeElement as HTMLElement).addClass('inside-10');
	}

	onSetClipPath(event: ClipPath) {
		this.clipPath = event;
		if (event.type=='circle' || event.type=='ellipse' || event.type == 'svg') {
			this.pHeight = 2.8;
			this.pWidth = 2.8;
		}
		else {
			this.setClipboxSize();
		}
		this.refreshView();
	}

	onSetOutsideClip(event: number) {
		if (!this.clipPath) return;
		this.clipPath.outside = event;
		this.refreshView();
	}

	getPolygon(): string{
		let result: string = '';
		this.clipPath.value.forEach((v, i) => {
			if (i>0)
				result += ',';
			result += v.x + '% ' + v.y + '%';
		})
		if (result != '')
			result = 'polygon(' + result + ')';
		return result;
	}

	getCircle(): string{
		return 'circle(' + Math.abs(50-this.clipPath.value[0].y) + '% at ' + this.clipPath.value[1].x + '% ' + this.clipPath.value[1].y + '%)';
	}

	getEllipse(): string{
		return 'ellipse(' + Math.abs(50-this.clipPath.value[0].x) + '% ' + Math.abs(50-this.clipPath.value[1].y) + '% at ' + this.clipPath.value[2].x + '% ' + this.clipPath.value[2].y + '%)';
	}

	getInset(): string{
		return 'inset(' + this.clipPath.value[0].y + '% ' + (100 - this.clipPath.value[1].x) + '% ' + (100 - this.clipPath.value[2].y) + '% ' + this.clipPath.value[3].x + '%)';
	}

	getClipPath() {
		if (!this.clipPath) return '';
		switch(this.clipPath.type) {
			case 'polygon':
				return this.sanitizer.bypassSecurityTrustStyle(this.getPolygon());
			case 'ellipse':
				return this.sanitizer.bypassSecurityTrustStyle(this.getEllipse());
			case 'circle':
				return this.sanitizer.bypassSecurityTrustStyle(this.getCircle());
			case 'inset':
				return this.sanitizer.bypassSecurityTrustStyle(this.getInset());
			case 'svg':
				return 'url(#svgPath)';
		}
		return '';
	}

	getClipPath1() {
		if (!this.clipPath) return '';
		switch(this.clipPath.type) {
			case 'polygon':
				return this.getPolygon();
			case 'ellipse':
				return this.getEllipse();
			case 'circle':
				return this.getCircle();
			case 'inset':
				return this.getInset();
		}
		return '';
	}

	getSVGPath() {
		let p =[1,2,3,4,5,6,7,1,0];
		let result = 'M ' + (this.extra * this.clipPath.value[0].x) + ' ' + (this.extra * this.clipPath.value[0].y) + ' ';
		for(let i = 0; i < 3; i++) {
			result += 'C ';
			for(let j = 0; j < 3; j++) {
				result += (this.extra * this.clipPath.value[p[i*3 + j]].x) + ' ' + (this.extra * this.clipPath.value[p[i*3 + j]].y) + ' ';
			}
		}
		result +='Z ';
		return result;
	}

	getOpacity() {
		return this.clipPath ? this.clipPath.outside : 1;
	}

	getXPosition(p: number) {
		return this.clipPath.type=='svg' ? p : this.pWidth * p;
	}

	getYPosition(p: number) {
		return this.clipPath.type=='svg' ? p : this.pHeight * p;
	}

	removalHandler(i: number) {
		if (this.clipPath.type=='svg') return false;
		if (this._totalHandlers < 4) return false;
		return this._currentHandler == i ? true : false;
	}

	backgroundImage(): SafeStyle {
		// this.resultImage.nativeElement.style.setProperty('background-image', imageUrl.imageUrl(this.itemContent.image));
		// return this.image ? this.sanitizer.bypassSecurityTrustStyle(`url('${this.image.location + "/" + this.image.name}')`) : '';
		return this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(this.image));
	}

	onRemoveHandler(i: number) {
		this.clipPath.value.splice(i,1);
		this.refreshView();
	}

	onDragStart(n: number, event: any) {
		this._currentHandler = n;
		setTimeout(() => {
			this._currentHandler = -1;
			this.refreshView();
		}, 2000);
	}

	onDrag(n: number, event: any) {
		this.clipPath.value[n].x = this.clipPath.type=='svg' ? event.left : event.left / this.pWidth;
		this.clipPath.value[n].y = this.clipPath.type=='svg' ? event.top : event.top / this.pHeight;
		this.refreshView();
	}

	onDragEnd(n: number, event: any) {
		this.refreshView();
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this._totalHandlers = this.clipPath.value.length;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
