import {
	 Component, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, Renderer2,
	 Input, Output, OnChanges, OnDestroy, OnInit, AfterViewInit, SimpleChanges, ViewChild
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
	SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { createWatermarkDialogWindow } from '@app-dialogs/watermark-dialog/watermark-dialog.component';
import { Item, CommonItemContent, ImagePath, PhotoInfo, PhotoImage, Watermark } from '@app/models';
import { Box } from '@app-lib/rect/rect';
import * as imageUrl from '@app-lib/functions/image-url';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'photo-item',
	templateUrl: 'photo.component.html',
	styleUrls: ['photo.component.css']
})

export class PhotoItemComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit{
	@Input() item: Item;
	@Input() editable = false;
	@Input() mobilePageView = false; // true: mobile, false: default
	@Input() processingItem: any = null;
	@Output() itemResize = new EventEmitter<Box>();
	@Output() itemChange = new EventEmitter<Item>();
	@Output() itemRemove = new EventEmitter<void>();

	@ViewChild('reviewContainer') reviewContainer: ElementRef;
	@ViewChild('resultImage') resultImage: ElementRef;
	@ViewChild('setText') setText: ElementRef;

	@ViewChild('thumbnails') public thumbnails: ElementRef;
	@ViewChild('usefulSwiper') usefulSwiper: any;
	@ViewChild('swiperWrapper') swiperWrapper: ElementRef;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;

	public itemContent: CommonItemContent<PhotoInfo>;
	public info: PhotoInfo;
	public isLabel = 'Show Label';
	public layout = 'side';
	private editUrl: ImagePath = undefined;

	public imgs: Array<PhotoImage> = [];
	public index = 0;

	public itemStyles = [
		{
			'float':'left',
			'box-shadow': '4px 4px 10px 2px #8c8c8c',
			'width': '80px',
			'height': '80px',
			'margin': '12px',
			'cursor': 'move',
			'border-radius': '5px'
		},
		{
			'float':'left',
			'box-shadow': '4px 4px 10px 2px #8c8c8c',
			'width': '60px',
			'height': '60px',
			'margin': '12px',
			'cursor': 'move',
			'border-radius': '5px'
		}
	];

	public _thumbDragStart = new Rx.Subject<number>();
	public _thumbDragEnd = new Rx.Subject<number>();
	public _thumbDrag = new Rx.Subject<[number, number]>();
	public _imageIndexChange = new Rx.Subject<number[]>();

	activeIndex = 0;
	isBeginning = true;
	isEnd = false;
	swiperConfig: SwiperConfigInterface;

	private viewInited = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private _renderer: Renderer2,
		private windowService: WindowService
	) { }

	ngOnInit() {
		this.itemContent = this.item.content as CommonItemContent<PhotoInfo>;
		this.info = lodash.cloneDeep(this.itemContent.info.value);
		this.imgs = this.info.imgs;
		this.isLabel = this.info.isLabel;
		this.activeIndex = this.info.index;
		this.layout = this.info.layout;

		this.swiperConfig = {
			direction: 'horizontal',
			observer: true,
			initialSlide: -1,
			slidesPerView: 8,
			spaceBetween: 5,
			grabCursor: true
		};

		this.subs = [
			this._imageIndexChange.subscribe(r => {
				this._renderer.setStyle(this.swiperWrapper.nativeElement, 'opacity', '1');
				this._renderer.setStyle(this.thumbnails.nativeElement as HTMLElement, 'z-index', null);

				this.imgs = withArray(this.imgs, ar =>
					r.forEach((di, i) => {
						ar[this.activeIndex + i + di] = this.imgs[this.activeIndex + i];
					}));
				// this.setResultImageStyle();
				this.refreshView();
			}),
		];
	}

	ngAfterViewInit() {
		if (this.setText && this.info.watermark)
			$(this.setText.nativeElement)[0]['innerHTML'] = this.info.watermark.textWatermark;

		if (this.usefulSwiper) {
			const eleWidth = this.usefulSwiper.nativeElement.clientWidth;
			const count = Math.floor(eleWidth / 80);
			this.swiperConfig.slidesPerView = count;
		}

		this.setWatermarkPosition();

		setTimeout(() => {
			if (this.mobilePageView) {
				this.directiveRef.setIndex(this.activeIndex);
			}

			const height = this.item.content.box.height();
			if (this.reviewContainer) {
				const eleHeight = (this.reviewContainer.nativeElement as HTMLElement).offsetHeight;
				if (height !== eleHeight)
					this.itemResize.emit(this.itemContent.box.setBottom(this.itemContent.box.top + eleHeight));
				// if (height != eleHeight)
				//	 this.item.content.box.bottom = this.itemContent.box.top + eleHeight;
			} else {
				this.itemRemove.next();
			}

			if (this.directiveRef)
				this.directiveRef.update();

			this.viewInited = true;
		});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited)
			return;

		if (changes['processingItem'].currentValue && changes['processingItem'].currentValue.item == this.item) {
			this.setWatermarkPosition();
		}
	}

	openImageEditorDialog() {
		let imageEditorDialog = createImageEditorWindow(this.windowService);

		if (this.editUrl != undefined) {
			imageEditorDialog.componentRef.instance.openImageInEditor(this.editUrl);
		}
		else {
			imageEditorDialog.componentRef.instance.refresh();
		}

		imageEditorDialog.componentRef.instance.newImage.subscribe(res => {
				imageEditorDialog.destroy();
				this.imgs[this.activeIndex].image = res;
			});

		imageEditorDialog.componentRef.instance.close.subscribe(() => {
				imageEditorDialog.destroy();
			});
		imageEditorDialog.open();
	}

	switchLabel() {
		if (this.isLabel == 'Show Label')
			this.isLabel = 'Hide Label';
		else
			this.isLabel = 'Show Label';
		this.info.isLabel = this.isLabel;
		this.updateItem();
	}

	selectImg(event: MouseEvent, index: number) {
		event.stopPropagation();
		if (this.activeIndex == index) return;
		this.activeIndex = index;
		// this.info.index = index;
	}

	previous(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (this.activeIndex > 0)
			this.activeIndex--;
		else
			this.activeIndex = this.imgs.length - 1;
		this.directiveRef.setIndex(this.activeIndex);
		this.refreshView();
	}

	next(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (this.activeIndex < this.imgs.length - 1)
			this.activeIndex++;
		else
			this.activeIndex = 0;
		this.directiveRef.setIndex(this.activeIndex);
		this.refreshView();
	}

	backgroundImage(image: ImagePath): SafeStyle {
		if (image && image['createdate']) {
			delete image['createdate'];
		}
		return image ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image)) : '';
	}

	addWatermark() {
		if (this.imgs.length > 0) {
			let addWatermark = createWatermarkDialogWindow(this.windowService, this.imgs[this.activeIndex].image, this.info.watermark);
			addWatermark.componentRef.instance.submit.subscribe(w => {
				this.info.watermark = w;
				this.itemChange.next(this.item.setContent(this.itemContent.setInfo(Maybe.just(this.info))));
			})
			addWatermark.open();
		}
	}

	setWatermarkPosition() {
		if (!this.info.watermark) return;

		const imgEle = this.resultImage.nativeElement as HTMLElement;
		const txtEle = this.setText.nativeElement as HTMLElement;

		this._renderer.setStyle(imgEle, 'background-image', imageUrl.imageUrl(this.info.watermark.imageWatermark));
		this._renderer.setStyle(imgEle, 'background-position', this.info.watermark.position);
		this.getImageSize(this.info.watermark.imageWatermark, imgEle);

		switch (this.info.watermark.position) {
			case 'top left':
				txtEle.style.setProperty('margin', '0 auto auto 0');
				break;

			case 'top center':
				txtEle.style.setProperty('margin', '0 auto 0 auto');
				break;

			case 'top right':
				txtEle.style.setProperty('margin', '0 0 auto auto');
				break;

			case 'left':
				txtEle.style.setProperty('margin', 'auto auto auto 0');
				break;

			case 'center':
				txtEle.style.setProperty('margin', 'auto');
				break;

			case 'right':
				txtEle.style.setProperty('margin', 'auto 0 auto auto');
				break;

			case 'bottom left':
				txtEle.style.setProperty('margin', 'auto auto 0 0');
				break;

			case 'bottom center':
				txtEle.style.setProperty('margin', 'auto auto 0 auto');
				break;

			case 'bottom right':
				txtEle.style.setProperty('margin', 'auto 0 0 auto');
		}
	}

	onEditor(img: ImagePath, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.editUrl = img;
		this.openImageEditorDialog();
	}

	onRemoveImg(index: number, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.imgs.splice(index, 1);

		if (this.imgs.length == 0)
			this.itemRemove.next();
		else {
			if (this.activeIndex >= this.imgs.length - 1)
				this.info.index = this.imgs.length - 1;
			else
				this.info.index = this.activeIndex + 1;
			this.updateItem();
		}
	}

	onDragEnd(event: any) {
		if (this.imgs.length == 0) return;
		this.updateItem();
	}

	saveLabel() {
		this.updateItem();
	}

	updateItem() {
		this.info.imgs = this.imgs;
		this.itemChange.next(this.item.setContent(this.itemContent.setInfo(Maybe.just(this.info))));
	}

	onArrowMouseDown(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
	}

	onPrev(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.activeIndex = Math.max(0, --this.activeIndex);
		this.directiveRef.setIndex(this.activeIndex);
		this.refreshView();
	}

	onNext(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.activeIndex = Math.min(this.imgs.length - 1, ++this.activeIndex);
		this.directiveRef.setIndex(this.activeIndex);
		this.refreshView();
	}

	gripDown(event: MouseEvent) {
		event.stopPropagation();
		this._renderer.setStyle(this.thumbnails.nativeElement, 'opacity', '1');
		this._renderer.setStyle(this.thumbnails.nativeElement, 'z-index', '10');
		this._renderer.setStyle(this.swiperWrapper.nativeElement, 'opacity', '0');
	}

	getImageSize(img: ImagePath, ele: HTMLElement, result = '40%') {
		const image = new Image;
		image.onload = (ev) => {
			let width = image.width;
			let height = image.height;

			if (width > ele.offsetWidth * 0.4) {
				const temp = ele.offsetWidth * 0.4;
				height = height * temp / width;
				width = temp;
			}

			if (height > ele.offsetHeight * 0.4) {
				const temp = ele.offsetHeight * 0.4;
				width = width * temp / height;
				height = temp;
			}

			this._renderer.setStyle(ele, 'background-size', `${width}px ${height}px`);
		};
		image.src = imageUrl.imageSrcUrl(img);
	}

	indexChanged(event: number) {
		if (!this.viewInited) return;
		this.isBeginning = this.directiveRef.swiper().isBeginning;
		this.isEnd = this.directiveRef.swiper().isEnd;
		this.activeIndex = event;
	}

	refreshView() {
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
		this.viewInited = false;
	}
}
