import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, HostListener, Input, Renderer } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
	SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import * as imageUrl from '@app-lib/functions/image-url';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { createLinkingDialogWindow, LinkingForm, LinkFormData } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { CommonItemContent } from '@app-models/item-info';

import { DEFAULT_ANIMATION, DEFAULT_ANIMATION_SPEED, ANIMATIONS } from '@app-shared/constants';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { ImagePath, SlideShowInfo, Slide, LinkSource } from '@app/models';

/** */
export function createSlideshowDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<SlideShowInfo>
): DialogWindow<SlideshowDialogComponent> {
	return windowService.create<SlideshowDialogComponent>(
		SlideshowDialogComponent,
		{
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			width: 320,
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
		).changeInputs((comp, window) => {
			comp.itemContent = itemContent
			comp.close.subscribe(() => window.close());
			comp.submit.subscribe(() => window.close());
		});
}

export interface SlideshowDialogValue {
	slides: Slide[];
	guideType: string;
	animationSpeed: number;
	animationType: string;
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'slideshow-dialog.component.html',
	styleUrls: ['slideshow-dialog.component.css']
})
export class SlideshowDialogComponent implements OnInit, OnDestroy {
	@Input() itemContent: CommonItemContent<SlideShowInfo> = new CommonItemContent<SlideShowInfo>(Maybe.just(SlideShowInfo.empty()));
	@Input() headerfooter: string = '';

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<CommonItemContent<SlideShowInfo>>();

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChild('thumbnails') public thumbnails: ElementRef;
	@ViewChild('result') public result: ElementRef;

	@ViewChild('usefulSwiper') usefulSwiper: any;
	@ViewChild('swiperWrapper') swiperWrapper: ElementRef;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;

	public _loading: boolean = false;
	public _dragFile = new Rx.Subject<ImagePath>();
	// ---------------------------------------------------------------

	public _thumbDragStart   = new Rx.Subject<number>();
	public _thumbDragEnd	 = new Rx.Subject<number>();
	public _thumbDrag		= new Rx.Subject<[number, number]>();
	public _slideIndexChange = new Rx.Subject<number[]>();

	public _clearSlide = new Rx.Subject<void>();

	public _thumbIndexes = lodash.range(0, 3);
	public _slides: Slide[] = lodash.range(0, 20).map(() => new Slide());
	public _setSlides = new Rx.Subject<Slide[]>();
	public _activeSlideIndex: number = 0;

	_activeIndex: number = 0;
	isBeginning: boolean = true;
	isEnd: boolean = false;

	public swiperConfig: SwiperConfigInterface = {
		direction: 'horizontal',
		observer: true,
		initialSlide: -1,
		slidesPerView: 3,
		spaceBetween: 5,
		grabCursor: true
	};

	public _toggleThumbsGuide = new Rx.Subject<void>();
	public _toggleDotsGuide   = new Rx.Subject<void>();

	public _draggingThumbIndex: number = 0;
	public _draggingThumbOffset: number = 0;

	// ---------------------------------------------------------------
	public _animationSpeed = new FormControl(DEFAULT_ANIMATION_SPEED);
	public _animationType  = new FormControl(DEFAULT_ANIMATION);
	public _guideType = new FormControl('thumbnails');

	// ---------------------------------------------------------------

	public _slidesNum: number = 15;
	public _animations = ANIMATIONS;

	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private sanitizer: DomSanitizer,
		private appService: AppService,
		private renderer: Renderer
	) {}

	get speed() {
		return (this._animationSpeed.value*10).toFixed(0);
	}

	setValue(slideshow: SlideshowDialogValue) {
		this._setSlides.next(slideshow.slides);
		this._guideType.setValue(slideshow.guideType, { emitEvent: false });
		this._animationSpeed.setValue(slideshow.animationSpeed, { emitEvent: false });
		this._animationType.setValue(slideshow.animationType || DEFAULT_ANIMATION, { emitEvent: true });
	}

	ngOnInit() {
		this.subs = [
			this._dragFile.subscribe(r=> {
				this._slides[this._activeSlideIndex].image = <ImagePath>r;
				this.refreshView();
			}),
			this._clearSlide.subscribe(() => {
				this._slides = updateArrayAt(this._slides, this._activeSlideIndex, s => new Slide());
				this.refreshView();
			}),
			this._setSlides.subscribe(r=> {
				this._slides = padArray(<Slide[]>r, this._slides.length, () => new Slide);
				this.refreshView();
			}),

			this._slideIndexChange.subscribe(r=> {
				this.renderer.setElementStyle(this.swiperWrapper.nativeElement, 'opacity', '1');
				this.renderer.setElementStyle(this.thumbnails.nativeElement as HTMLElement, 'z-index', '');

				this._slides = withArray(this._slides, ar =>
					r.forEach((di, i) => {
						ar[this._activeIndex + i + di] = this._slides[this._activeIndex + i];

					}));
				this.refreshView();
			}),

			Rx.Observable.merge(
				this._animationSpeed.valueChanges,
				this._animationType.valueChanges,
				this._guideType.valueChanges,
				this._thumbDragStart,
				this._thumbDragEnd,
				this._thumbDrag)
			.subscribe(() => this.changeDetector.detectChanges())
		];

		this.setValue(
			{
				slides: this.itemContent.info.value.slides,
				guideType: this.itemContent.info.value.guideType,
				animationSpeed: this.itemContent.info.value.animationSpeed,
				animationType: this.itemContent.info.value.animationType
			});

		setTimeout(() => {
			this.directiveRef.update();
		});
	}

	isActive(tool: string) {
		switch (tool) {
			case 'Change':
				return lodash.findIndex(this._slides, slide=>slide.image != undefined)>=0 ? true : false;
			case 'Link':
				if (this._slides[this._activeSlideIndex].link)
					return true;
				else
					return false;
		}
	}

	openImageImportDialog() {
		let importDialog = createImageImportDialogWindow( this.windowService);
		importDialog.componentRef.instance.submit.subscribe(res => {
			this._dragFile.next(res);
			importDialog.destroy();
		});

		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});

		importDialog.open();
	}

	openImageEditorDialog() {
		let imageEditorDialog = createImageEditorWindow(this.windowService);

		if (this._slides[this._activeSlideIndex]) {
			imageEditorDialog.componentRef.instance.openImageInEditor(this._slides[this._activeSlideIndex].image);
		}
		else {
			imageEditorDialog.componentRef.instance.refresh();
		}

		imageEditorDialog.componentRef.instance.newImage.subscribe(res => {
				imageEditorDialog.destroy();
				this._dragFile.next(res);
			});

		imageEditorDialog.componentRef.instance.close.subscribe(() => {
				imageEditorDialog.destroy();
			});
		imageEditorDialog.open();
	}

	openLinkingDialog(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		const img = this._slides[this._activeSlideIndex].image;
		let linkForm = new LinkingForm();
		let linkDialog = createLinkingDialogWindow(this.windowService, linkForm);

		if (img)
			linkDialog.changeInputs(c => {
				c.form.setLinkValue(
					new LinkFormData(
						new LinkSource('LinkSourceImage', img.location + '/' + img.name),
						this._slides[this._activeSlideIndex].link
					)
				);
			});
		else
			linkForm.setValue(
				new LinkFormData(
					undefined,
					this._slides[this._activeSlideIndex].link
				)
			);

		linkDialog.componentRef.instance.submit.subscribe(result => {
			this._slides[this._activeSlideIndex].link = result;
			this.changeDetector.detectChanges();
			linkDialog.destroy();
		});
		linkDialog.componentRef.instance.close.subscribe(result => {
			linkDialog.destroy();
		});
		linkDialog.open();
	}

	playAnimate() {
		let ele = this.result.nativeElement as HTMLElement;
		let speed = this._animationSpeed.value;

		if (speed == 1)
			speed = 0.001;
		else if (speed>0)
			speed = 1 - speed;

		this.renderer.setElementStyle(ele, 'animation-duration', '' + 10 * speed + 's');

		$(ele).addClass('animated ' + this._animationType.value).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
			$(ele).removeClass('animated ' + this._animationType.value);
		});
		this.changeDetector.detectChanges();
	}

	onGoto(i: number) {
		this._activeSlideIndex = i;
		this.refreshView();
	}

	onPrev() {
		this.directiveRef.prevSlide();
	}

	onNext() {
		this.directiveRef.nextSlide();
	}

	indexChanged(event: number) {
		this.isBeginning = (event == 0);
		this.isEnd = (event >= this._slides.length - 3);
		this._activeIndex = event;
		if (this._activeSlideIndex < this._activeIndex)
			this._activeSlideIndex = this._activeIndex;
		else if (this._activeSlideIndex > this._activeIndex + 2)
			this._activeSlideIndex = this._activeIndex + 2;
		this.refreshView();
	}

	onGripDown(event: MouseEvent) {
		event.stopPropagation();
		this.renderer.setElementStyle(this.thumbnails.nativeElement, 'opacity', '1');
		this.renderer.setElementStyle(this.thumbnails.nativeElement, 'z-index', '10');
		this.renderer.setElementStyle(this.swiperWrapper.nativeElement, 'opacity', '0');
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		this.itemContent = this.itemContent
			.setInfo(
				Maybe.just(
					new SlideShowInfo(
						lodash.filter(this._slides, (slide) => {
							return slide && slide.image ? true : false;
						}),
						this._guideType.value,
						lodash.round(this._animationSpeed.value, 2),
						this._animationType.value
					)
				)
			);

		switch(this._guideType.value) {
			case 'thumbnails':
				if (this.itemContent.box.width() < 310)
					this.itemContent = this.itemContent.setBox(this.itemContent.box.setRight(this.itemContent.box.left + 310));
				break;
			case 'dots':
				let dot_width = this._slides.length * 20;
				if (this.itemContent.box.width() < dot_width)
					this.itemContent = this.itemContent.setBox(this.itemContent.box.setRight(this.itemContent.box.left + dot_width));
				break;
		}
		this.submit.emit(this.itemContent);
		}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, 'wsli119').open();
	}

	uploadeImages(files: File[]) {
		this.refreshView(true);
		this.callingAPI = this.appService.uploadImages(files).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						if (this.loadingComponent)
							this.loadingComponent.set(Math.min(event.loaded/event.total * 100, 98));
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
							this._dragFile.next(img as ImagePath);
						} else {
							this.refreshView();
						}
						break;
				}
			},
			error => {
				console.log(error);
				this.refreshView();
				// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
			},
			() => {
			}
		);
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	onDragOver(e) {
		e.preventDefault();
		(this.result.nativeElement as HTMLElement).style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		(this.result.nativeElement as HTMLElement).style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		(this.result.nativeElement as HTMLElement).style.opacity = '1';
		let files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.indexOf('image')>=0) {
			this.uploadeImages([files[0]]);
		}
	}

	backgroundImage(image: ImagePath): SafeStyle {
		return image ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image)) : '';
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}

	@HostListener('dragover', ['$event']) onEleDragOver(e) {
		e.preventDefault();
	}

	@HostListener('drop', ['$event']) onEleDrop(e) {
		e.preventDefault();
	}

}
