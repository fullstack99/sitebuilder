import {
	Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef,
	OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer,
	AfterViewInit, HostListener
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormBuilder, FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	isEqual as _isEqual,
	range as _range
} from 'lodash';
import { path } from 'ramda';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Maybe } from '@app-lib/maybe/maybe';
import { withArray } from '@app-lib/array/array';
import * as imageUrl from '@app-lib/functions/image-url';

import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createImageEditorWindow, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.component';

import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { createAttentionDialogWindow, AttentionInfo, DispStr } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { BackgroundInfo, BackgroundColorInfo, BackgroundImageInfo, BackgroundTilingInfo, ImagePath, Category, WSDetail, BackgroundVideoInfo } from '@app/models';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { CATEGORIES } from '@app-shared/constants';
import { WSService, ImageService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { environment } from '@app-environments/environment';

export function createBackgroundDialogWindow(
	windowService: WindowService,
	background_info: BackgroundInfo,
	title: string,
	enableParallax: boolean
): DialogWindow<BackgroundDialogComponent> {
	return windowService.create<BackgroundDialogComponent>(
		BackgroundDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
	comp.title = title;
		comp.background_info = _cloneDeep(background_info);
	if (!enableParallax)
	  comp.tabParallax = null;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: './background-dialog.component.html',
	styleUrls: ['./background-dialog.component.css']
})
export class BackgroundDialogComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy{

  @Input() title: string = 'BACKGROUND';
	@Input() background_info: BackgroundInfo;

	@Output('submit') submit = new EventEmitter<BackgroundInfo>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChild('resultImageBehindColor') resultImageBehindColor: ElementRef;

	@ViewChild('resultImage') resultImage: ElementRef;
	@ViewChild('colorPalette') colorPalette: ElementRef;
	@ViewChild('colorImagePalette') colorImagePalette: ElementRef;
	@ViewChild('colorTilingPalette') colorTilingPalette: ElementRef;

	@ViewChild('imagesContainer') public imagesContainer: ElementRef;

	public _elem: HTMLElement;
	public _colorElem: JQuery;
	public kendoColorPicker: kendo.ui.ColorPicker;
	public kendoColorPalette: kendo.ui.ColorPalette;

	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	tabs: WSDetail[] = [];
	tabColor: WSDetail = { id: 0, name: 'Colors'};
	tabImage: WSDetail = { id: 1, name: 'Image'};
	tabParallax: WSDetail = { id: 2, name: 'Parallax'};
	tabTiling: WSDetail = { id: 3, name: 'Tiling'};

	public activeTab: WSDetail = this.tabColor;
	public tab_categories = [
		'',
		'page_background',
		'',
		'page_tiling',
		'page_video'
	];

	public _selectTab = new Rx.Subject<WSDetail>();
	public _systemImagesContainerScroll = new Rx.Subject<void>();
	public _systemImages: ImagePath[] = [];
	public _catchCategory = new Rx.Subject<Category>();

	public _thumbDragStart = new Rx.Subject<number>();
	public _thumbDragEnd = new Rx.Subject<number>();
	public _thumbDrag = new Rx.Subject<[number, number]>();s
	public _imageIndexChange = new Rx.Subject<number[]>();

	public _loading: boolean = false;
	public _loadingText: string = "Uploading...";

	public attention_content: DispStr[] = [
		{ value: 'Parallax is for <u>multi-image</u> backgrounds.', font_size: '14px', color: '#8c8c8c' },
		{ value: 'Any <u>single background image</u> will be removed.', font_size: '14px', color: '#8c8c8c' },
		{ value: 'For more on Parallax click on tooltip.', font_size: '14px', color: '#8c8c8c' }
	];

	public horizontal: FormControl = new FormControl(0);
	public vertical: FormControl = new FormControl(0);

	public opacity: FormControl = new FormControl(100);
	public tilingOpacity: FormControl = new FormControl(100);

	public backImage: FormControl = new FormControl(null);
	public tilingImage: FormControl = new FormControl(null);
	public imageAdjustItem: FormControl = new FormControl('opacity');
	public imageScrolling: FormControl = new FormControl('move');
	public tilingAdjustItem: FormControl = new FormControl('');

	_rangeHorizontal = [0, 100];
	_rangeVertical = [0, 100];
	_rangeOpacity = [0, 100];

	_selectedCategory: any = null;
	_imageCategories: any = [];
	_tilingCategories: any = [];
	showCategoryValue = (c) => c ? c.description : '';

	_dispImageIndex: number = 0;
	_which: string[] = ['navigation'];

	public _activeImageIndex: number = 0;

	public _gotoImage = new Rx.Subject<number>();

  	private originBackgroundInfo: BackgroundInfo;
	private currentImage: ImagePath = null;
	private feedbackCode = ['ca.g.130', 'ca.g.132', 'ca.g.132', 'ca.g.133', 'ca.g.135'];
	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private renderer: Renderer,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
	private imageService: ImageService,
	private wsService: WSService,
		private appService: AppService
	) { }

	ngOnInit() {
	if (!!this.tabParallax) {
	  this.tabs = [this.tabColor, this.tabImage, this.tabParallax, this.tabTiling];
	} else {
	  this.tabs = [this.tabColor, this.tabImage, this.tabTiling];
	}

	this.originBackgroundInfo = _cloneDeep(this.background_info);

		if (this.background_info.backgroundImage) {
			const n = 5 - this.background_info.backgroundImage.multiImages.length;
			this.background_info.backgroundImage.multiImages = [...this.background_info.backgroundImage.multiImages, ..._range(0, n).map(() => null)];
		}

		this._elem = this.elementRef.nativeElement;

		const initialImages = this._catchCategory
			.map(s => {
				this._selectedCategory = s;
				return this.getImages(0, 9);
			})
			.switch().publish().refCount();

		const moreImages = this._systemImagesContainerScroll
			.map(() => {
				const el = this.imagesContainer.nativeElement as HTMLElement;
				return el.scrollHeight - el.offsetHeight - el.scrollTop;
			})
			.filter(scrollBottom => scrollBottom === 0)
			.map(() =>
				this.getImages(this._systemImages.length - 1, 9))
			.switch().publish().refCount();

		this.subs = [
			Rx.Observable.merge(
				initialImages.tagO<'init'>('init'),
				moreImages.tagO<'more'>('more'))
				.scan((acc: ImagePath[], {tag, val}) => {
					switch (tag) {
						case 'init': return val;
						case 'more': return acc.concat(val);
					}
				},[])
				.subscribe(r=> {
		  this._systemImages = [];
		  if (r && r.data) {
			r.data.forEach(r=> {
			  let imageItems = r.items.filter(i=>i.itemType == 'ImageItem');
			  imageItems.forEach(ii => {
				this._systemImages.push(ii.content.image)
			  })
			});
		  }
					this.refreshView();
				}),

			this._gotoImage.subscribe(r=> {
				this._activeImageIndex = r;
				this.refreshView();
				this.setResultImageStyle();
			}),

			this._imageIndexChange.subscribe(r=> {
				if (this.background_info.backgroundImage) {
					this.background_info.backgroundImage.multiImages = withArray(this.background_info.backgroundImage.multiImages, ar =>
						r.forEach((di, i) => {
							if (this.background_info.backgroundImage)
								ar[i + di] = this.background_info.backgroundImage.multiImages[i];
						}));
					this.setResultImageStyle();
				}
				this.refreshView();
			}),

			this._selectTab.subscribe(res => {
				if (['Colors', 'Parallax'].indexOf(res.name) < 0)
					this.getCategories(res);
				this.activeTab = res;
				this.selectedTabRefresh(res.name);
			}),

			this.horizontal.valueChanges.subscribe(() => {
				this.background_info.backgroundColor.horizontal = Math.floor(this.horizontal.value);
				this.vertical.setValue(0, { emitEvent: false });
				this.background_info.backgroundColor.vertical = 0;
				this.refreshView();
			}),
			this.vertical.valueChanges.subscribe(() => {
				this.background_info.backgroundColor.vertical = Math.floor(this.vertical.value);
				this.horizontal.setValue(0, { emitEvent: false });
				this.background_info.backgroundColor.horizontal = 0;
				this.refreshView();
			}),

			this.opacity.valueChanges.subscribe(() => {
				if (this.background_info.backgroundImage)
					this.background_info.backgroundImage.imageOpacity = Math.floor(this.opacity.value);
				this.refreshView();
				this.setResultImageStyle();
			}),

			this.tilingOpacity.valueChanges.subscribe(() => {
				if (this.background_info.backgroundTiling)
					this.background_info.backgroundTiling.tilingOpacity = Math.floor(this.tilingOpacity.value);
				this.refreshView();
				this.setResultImageStyle();
			}),

			this.imageScrolling.valueChanges.subscribe(() => {
				if (this.background_info.backgroundImage)
					this.background_info.backgroundImage.imageScrolling = this.imageScrolling.value;
				this.refreshView();
				this.setResultImageStyle();
			}),

			this.backImage.valueChanges.subscribe((image) => {
				if (this.background_info.backgroundImage)
					this.background_info.backgroundImage.image = image;
				this.refreshView();
				this.setResultImageStyle();
			}),

			this.tilingImage.valueChanges.subscribe((image) => {
				if (this.background_info.backgroundTiling)
					this.background_info.backgroundTiling.image = image;
				this.refreshView();
				this.setResultImageStyle();
			}),

			Rx.Observable.merge(
				this.backImage.valueChanges,
				this.tilingImage.valueChanges,
				this.imageAdjustItem.valueChanges,
				this.tilingAdjustItem.valueChanges,
				this._thumbDragStart,
				this._thumbDragEnd,
				this._thumbDrag
			).subscribe(() => {
				if (this.background_info.backgroundImage)
					this.setResultImageStyle();
				this.refreshView();
			})
		];

		this.createColorPaletee();
		this.createColorPickerWindow();
	}

	ngAfterViewInit() {
		this.startup();
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	getCategories(tab: WSDetail) {
		this._systemImages = [];
	this.refreshView();
	let suid = ''
	switch(tab.name) {
	  case 'Image':
		suid = environment.BackgroundImages;
		break;
	  case 'Tiling':
		suid = environment.BackgroundTiling;
		break;
	  case 'Video':
		suid = environment.BackgroundVideo;
		break;
	}

	if (!suid)
		return;

		// let uid = CATEGORIES[this.tab_categories[tab.id]];
		const categories = this.wsService.getCategories(null, suid);
		categories.subscribe(
			res => {
		console.log(res);
				this._imageCategories = res;
				this._catchCategory.next(null);
			},
			error => {
				console.log('category', error);
			},
			() => {
			}
		);
	}

	setDefaultBackgroundImage(backInfo = BackgroundImageInfo.empty(), isDefault = true) {
		let defaultColor = backInfo.imageBehindColor;
		if (isDefault) {
			this.background_info.backgroundImage = backInfo;
		}
		this.backImage.setValue(backInfo.image, { emitEvent: false });
		this.opacity.setValue(backInfo.imageOpacity, { emitEvent: false });
		this.imageAdjustItem.setValue('', { emitEvent: false });
		this.imageScrolling.setValue(this.activeTab.name == 'Parallax' ? 'parallax' : backInfo.imageScrolling == 'freeze' ? backInfo.imageScrolling : 'move');
		$(this.colorImagePalette.nativeElement).data('kendoColorPalette').value(defaultColor ? defaultColor : '#ffaabb');
	}

	setDefaultTiling(tilingInfo = BackgroundTilingInfo.empty(), isDefault = true) {
		let defaultColor = tilingInfo.tilingBehindColor;
		if (isDefault) {
			this.background_info.backgroundTiling = tilingInfo;
		}
		this.tilingOpacity.setValue(tilingInfo.tilingOpacity, { emitEvent: false });
		this.tilingAdjustItem.setValue('', { emitEvent: false });
		this.tilingImage.setValue(tilingInfo.image);
		$(this.colorTilingPalette.nativeElement).data('kendoColorPalette').value(defaultColor ? defaultColor : '#ffaabb');
	}

	selectedTabRefresh(s: string) {
		switch (s) {
			case 'Colors':
				//this.setDefaultBackgroundColor();
				break;
			case 'Image':
				this.setDefaultBackgroundImage(this.background_info.backgroundImage);
				break;
			case 'Parallax':
				this.setDefaultBackgroundImage(this.background_info.backgroundImage);
				break;
			case 'Tiling':
				this.setDefaultTiling(this.background_info.backgroundTiling);
				break;
			case "Video":
		}
		this.refreshView();
		this.setResultImageStyle();
	}

	startup() {
		let defautBackgroundImage = BackgroundImageInfo.empty();
		defautBackgroundImage.multiImages = [..._range(0, 5).map(() => null)];
		if (!this.background_info.backgroundColor) this.background_info.backgroundColor = BackgroundColorInfo.empty();

		if (this.background_info.backgroundColor && this.background_info.backgroundColor.horizontal > 0) {
			let horizontal = this.background_info.backgroundColor.horizontal;
			this.horizontal.setValue(horizontal, {});
			this.horizontal.setValue(horizontal, {});
		}	else if (this.background_info.backgroundColor && this.background_info.backgroundColor.vertical) {
			let vertical = this.background_info.backgroundColor.vertical;
			this.vertical.setValue(vertical, {});
			this.vertical.setValue(vertical, {});
		}

		if (this.background_info.backgroundTiling && !_isEqual(this.background_info.backgroundTiling,BackgroundTilingInfo.empty())) {
			this._selectTab.next(this.tabTiling);
		} else if (this.background_info.backgroundImage && !_isEqual(this.background_info.backgroundImage, defautBackgroundImage)) {
			if (this.background_info.backgroundImage.imageScrolling == 'parallax' && !!this.tabParallax)
				this._selectTab.next(this.tabParallax);
			else
				this._selectTab.next(this.tabImage);
		}
	}

	createColorPickerWindow() {
		const colorPicker = createColorPickerWindow(this.windowService, new ColorPickerForm(new ColorRgb()));
		colorPicker.componentRef.instance.close.subscribe(color => {
			this._elem.style.setProperty('opacity', '1');
			color.apply(this._onColorPicked);
		});
		this._colorPickerWindow = Maybe.just(colorPicker);
	}

	openImageEditor() {
		let image: ImagePath = null;
		switch (this.activeTab.name) {
			case 'Image':
				image = this.backImage.value;
				break;
			case 'Parallax':
				if (this.background_info.backgroundImage)
					image = this.background_info.backgroundImage.multiImages[this._activeImageIndex];
				break;
			case 'Tiling':
				image = this.tilingImage.value;
				break;
		}
		if (!image) return;

		let imageEditor: DialogWindow<ImageEditorComponent>;
		imageEditor = createImageEditorWindow(this.windowService);
		imageEditor.componentRef.instance.openImageInEditor(image);
		imageEditor.componentRef.instance.newImage.subscribe(result => {
				imageEditor.destroy();
				image.location = result.location;
				image.name = result.name;
				this.setResultImageStyle();
				this.refreshView();
			});
		imageEditor.componentRef.instance.close.subscribe(() => {
				imageEditor.destroy();
			});
		imageEditor.open();
	}

	setAdjustItem(item: string) {
		if (this.activeTab.name == 'Tiling') {
			this.tilingAdjustItem.setValue(item);
		}
		else {
			this.imageAdjustItem.setValue(item);
		}
	}

	setImagePosition(position: string) {
		if (this.background_info.backgroundImage)
			this.background_info.backgroundImage.imagePosition = position;
		this.setResultImageStyle();
		this.refreshView();
	}

	setBackGroundImage(img: ImagePath, index: number = -1) {
		if (this.activeTab.name == 'Colors') return;
		switch (this.activeTab.name) {
			case 'Image':
				this.backImage.setValue(img);
				break;
			case 'Parallax':
				if (this.background_info.backgroundImage) {
					if (index >=0)
						this.background_info.backgroundImage.multiImages[index] = img;
					else
						this.background_info.backgroundImage.multiImages[this._activeImageIndex] = img;
				}
				break;
			case 'Tiling':
				this.tilingImage.setValue(img);
				break;
		}
		this.setResultImageStyle();
		this.refreshView();
	}

	getImages(skip?: number, take?: number): Rx.Observable<any> {
		let suid = '';
		let uid = '';
			switch (this.activeTab.name) {
		case "Image":
			suid = environment.BackgroundImages;
					break;
		case "Tiling":
			suid = environment.BackgroundTiling;
					break;
		case "Video":
			suid = environment.BackgroundVideo;
					break;
		}
		if (this._selectedCategory) {
			uid = this._selectedCategory.uid;
		} else if (this._imageCategories[0]) {
			uid = this._imageCategories[0].uid;
		}

		if (!suid || !uid)
		return Rx.Observable.of([]);

		return this.wsService.getThemePage(uid, null, null, null, true, true, suid);
	}

	backgroundImage(img: ImagePath): SafeStyle {
		return img ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(img)) : '';
	}

	getBackgroundImageSize(img: ImagePath, ele: HTMLElement): Promise<string> {
		return new Promise(resolve => {
			let result: string = '';
			let image = new Image;
			image.onload = (ev) => {
				if (image.width == 0 && image.height == 0 || image.width > ele.offsetWidth || image.height > ele.offsetHeight)
					result='contain';
				resolve(result);
			}
			image.src = imageUrl.imageSrcUrl(img);
		});
	}

	createColorPaletee() {
		$(this.colorPalette.nativeElement).kendoColorPalette({
			palette: "basic",
	  value: path(['backgroundColor', 'startColor'])(this.background_info) || '#ffaabb',
			tileSize: {
				width: 10, height: 10
			},
			change: (e: any) => {
				this.palette_change(e.value, 0);
			}
		});
		$(this.colorImagePalette.nativeElement).kendoColorPalette({
			palette: "basic",
			value: "#ffaabb",
			tileSize: {
				width: 10, height: 10
			},
			change: (e: any) => {
				this.palette_change(e.value, 1);
			}
		});
		$(this.colorTilingPalette.nativeElement).kendoColorPalette({
			palette: "basic",
			value: "#ffaabb",
			tileSize: {
				width: 10, height: 10
			},
			change: (e: any) => {
				this.palette_change(e.value, 2);
			}
		});
		$(this.colorPalette.nativeElement).data("kendoColorPalette");
		$(this.colorImagePalette.nativeElement).data("kendoColorPalette");
		$(this.colorTilingPalette.nativeElement).data("kendoColorPalette");
	}

	palette_change(e: string, n: number) {
	if (!this.background_info.backgroundColor) {
	  this.background_info.backgroundColor = BackgroundColorInfo.empty();
	}

		switch (n) {
			case 0:
				this.background_info.backgroundColor.startColor = e;
				this.refreshView();
				break;
			case 1:
				if (this.background_info.backgroundImage)
					this.background_info.backgroundImage.imageBehindColor = e;
				this.setResultImageStyle();
				break;
			case 2:
				if (this.background_info.backgroundTiling)
					this.background_info.backgroundTiling.tilingBehindColor = e;
				this.setResultImageStyle();
		}

	}

	setNoneColor(n: number) {
		switch (n) {
			case 0:
				$(this.colorPalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				this.background_info.backgroundColor = undefined;
				break;
			case 1:
				$(this.colorImagePalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				if (this.background_info.backgroundImage)
					this.background_info.backgroundImage.imageBehindColor = '';
				break;
			case 2:
				$(this.colorTilingPalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				if (this.background_info.backgroundTiling)
					this.background_info.backgroundTiling.tilingBehindColor = '';
		}
		this.refreshView();
		this.setResultImageStyle();
	}

	openColorPicker(n: number) {
		this._colorPickerWindow.map(w => {
			this._onColorPicked = Maybe.just((c: ColorRgb) => this.setPickedColor(c.toString(), n));
			this._elem.style.setProperty('opacity', '0');
			w.open();
		});
	}

	setPickedColor(color: string, n: number) {
		Maybe.match(color, /rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
			.map(() => {
				this.palette_change(color, n);
			});
	}

	setDefaultBackgroundInfo(n: number) {
		if (n == 0) {
			this.setNoneColor(0);
			this.refreshView();
			// this.onAdd();
		} else if (n == 1) {
			if (this.activeTab.name == 'Image' || this.activeTab.name == 'Parallax') {
				if (this.activeTab.name == 'Image') {
					this.backImage.setValue(null);
				// this.background_info.backgroundImage.image = null;
				} else if (this.activeTab.name == 'Parallax') {
					this.background_info.backgroundImage.multiImages.forEach((i, index) => {
						this.background_info.backgroundImage.multiImages[index] = null;
					});
				}
				$(this.colorImagePalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				this.opacity.setValue(100);
				this.refreshView();
			} else if (this.activeTab.name == 'Tiling') {
				this.background_info.backgroundTiling = BackgroundTilingInfo.empty();
				$(this.colorTilingPalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				this.tilingOpacity.setValue(100, { emitEvent: false });
				this.tilingImage.setValue(null, { emitEvent: true });
			}
		}
	}

	getBackgroundColor(): SafeStyle {
		let result: string = '';
		let direction: number = 0;
		let amount: string = "0%";

		if (!this.background_info.backgroundColor)
			return (this.sanitizer.bypassSecurityTrustStyle(result));

		if (this.background_info.backgroundColor.vertical > 0) {
			direction = 0;
			amount = this.background_info.backgroundColor.vertical + "%";
		}
		if (this.background_info.backgroundColor.horizontal > 0) {
			direction = 1;
			amount = this.background_info.backgroundColor.horizontal + "%";
		}

		if (amount == '0%') {
			result = this.background_info.backgroundColor.startColor;
		} else {
			if (navigator.userAgent.indexOf("Safari") != -1 && parseInt(navigator.appVersion) <= 6 && navigator.userAgent.indexOf("Chrome") == -1) {
				result = "-webkit-linear-gradient(";
				if (direction == 0) {
					result += " top";
				} else {
					result += " left";
				}
			} else {
				if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
					result = "-o-linear-gradient(";
				} else if (navigator.userAgent.indexOf("Firefox") != -1) {
					result = "-moz-linear-gradient(";
				} else if (navigator.userAgent.indexOf("Chrome") != -1) {
					result = "linear-gradient(to";
				} else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) {//IF IE > 10
					result = "linear-gradient(";
				} else {
					result = "linear-gradient(to";
				}

				if (direction == 0) {
					result += " bottom";
				} else {
					result += " right";
				}
			}
			result += ", " + this.background_info.backgroundColor.startColor + " " + amount + ", " + this.background_info.backgroundColor.endColor + ")";
		}
		if (result == '')
			result = 'white';
		return (this.sanitizer.bypassSecurityTrustStyle(result));
	}

	dispAddImageText(): boolean {
		switch (this.activeTab.name) {
			case 'Image':
				if (this.backImage.value != null)
					return false;
				break;
			case 'Parallax':
				if (this.background_info.backgroundImage && this.background_info.backgroundImage.multiImages[this._activeImageIndex] != null)
					return false;
			case 'Tiling':
				if (this.tilingImage.value != null)
					return false;
				break;
		}
		return true;
	}

	setResultImageStyle() {
		if (this.activeTab.name == 'Colors') return;
		let ele = this.resultImage.nativeElement as HTMLElement;
		switch (this.activeTab.name) {
			case 'Image':
				this.currentImage = this.backImage.value;
				ele.style.setProperty('background-image', this.currentImage ? imageUrl.imageUrl(this.currentImage) : '');
				ele.style.setProperty('background-repeat', 'no-repeat');
				let imageSize = this.getBackgroundImageSize(this.currentImage, ele);
				imageSize.then(res => {
					ele.style.setProperty('background-size', res);
				});
				if (this.background_info.backgroundImage)
					ele.style.setProperty('opacity', (this.background_info.backgroundImage.imageOpacity / 100).toString());
				break;

			case 'Parallax':
				if (this.background_info.backgroundImage && this.currentImage != this.background_info.backgroundImage.multiImages[this._activeImageIndex]) {
					this.currentImage = this.background_info.backgroundImage.multiImages[this._activeImageIndex];
					ele.style.setProperty('background-image', this.currentImage ? imageUrl.imageUrl(this.currentImage) : '');
					ele.style.setProperty('background-position', 'center');
					ele.style.setProperty('background-repeat', 'no-repeat');
					imageSize = this.getBackgroundImageSize(this.currentImage, ele);
					imageSize.then(res => {
						ele.style.setProperty('background-size', res);
					});
				}
				if (this.background_info.backgroundImage)
					ele.style.setProperty('opacity', (this.background_info.backgroundImage.imageOpacity / 100).toString());
				break;

			case 'Tiling':
				ele.style.setProperty('background-image', this.tilingImage.value ? imageUrl.imageUrl(this.tilingImage.value) : '');
				ele.style.setProperty('background-repeat', 'repeat');
				ele.style.setProperty('background-size', 'contain');
				imageSize = this.getBackgroundImageSize(this.tilingImage.value, ele);
				imageSize.then(res => {
					ele.style.setProperty('background-size', res);
				});
				if (this.background_info.backgroundTiling)
					ele.style.setProperty('opacity', (this.background_info.backgroundTiling.tilingOpacity / 100).toString());
				break;
		}
		this.setImageBehindColor();
	}

	setImageBehindColor() {
	  let ele = this.resultImageBehindColor.nativeElement as HTMLElement;
	  switch (this.activeTab.name) {
		case 'Image':
		case 'Parallax':
		  if (this.background_info.backgroundImage)
			ele.style.setProperty('background-color', this.background_info.backgroundImage.imageBehindColor);
		  break;
		case 'Tiling':
		  if (this.background_info.backgroundTiling)
			ele.style.setProperty('background-color', this.background_info.backgroundTiling.tilingBehindColor);
		  break;
	  }
	}

	onClose() {
	  this.close.emit();
	}

	onAdd() {
		if (this.background_info.backgroundImage)
			this.background_info.backgroundImage.multiImages = this.background_info.backgroundImage.multiImages.filter(image=>!!image);

		if (differenceDeep.isDifference(this.background_info, new BackgroundInfo(BackgroundColorInfo.empty(), BackgroundImageInfo.empty(), BackgroundTilingInfo.empty(), BackgroundVideoInfo.empty()), ['imageScrolling']))
			this.submit.emit(this.background_info);
		else
			this.submit.emit(new BackgroundInfo());
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, this.feedbackCode[this.activeTab.id]);
		feedbackWindow.open();
	}

	openImportDialog() {
		let importDialog = createImageImportDialogWindow(this.windowService);
		importDialog.componentRef.instance.submit.subscribe(s => {
			this.setBackGroundImage(s);
			importDialog.destroy();
		});
		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});
		importDialog.open();
	}

	openAttentionDialog(event: Event) {
		event.preventDefault();
		let attentionWindow = createAttentionDialogWindow(
				this.windowService,
				new AttentionInfo(
				{ value: 'ATTENTION!', font_size: '22px', color: 'red' },
				this.attention_content,
				false,
				['Proceed', 'Stop'],
				'ca.g.136'
			));

		attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			if (feedback) {
				if (this.background_info.backgroundImage) {
					this.background_info.backgroundImage.imageBehindColor = '';
					$(this.colorImagePalette.nativeElement).data('kendoColorPalette').value('#ffaabb');
				}
				this.backImage.setValue(null, {});
				this.imageAdjustItem.setValue('multiple', {});
				this.setResultImageStyle();
			}
			else {
				this.imageAdjustItem.setValue('single', {});
				//this.refreshView();
			}
		});
		attentionWindow.open();
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
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

						const tuid = _get(event, 'body.tuid');
						const img = _get(event, ['body', 'urls', 0]);
									
						if (tuid) {
							localStorage.setItem('tuid', _get(event, 'body.tuid'));
						}
						if (img) {
							this.setBackGroundImage(img);
						}
						break;
				}
			},
			error => {
				console.log(error)
				// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
			},
			() => {
				this.refreshView();
			}
		);
	}

	getSubmitButtonText() {
		switch(this.activeTab.name) {
			case 'Colors':
				if (_get(this.originBackgroundInfo, 'backgroundColor.startColor') && !_get(this.background_info, 'backgroundColor.startColor')) {
					return 'REMOVE';
				} else {
					return 'ADD';
				}
			case 'Image':
				if (_get(this.originBackgroundInfo, 'backgroundImage.image') && !_get(this.background_info, 'backgroundImage.image')) {
					return 'REMOVE';
				} else {
					return 'ADD';
				}
			case 'Parallax':
				const oi = _get(this.originBackgroundInfo, 'backgroundImage.multiImages', []);
				const ni = _get(this.background_info, 'backgroundImage.multiImages', []);
				const o = oi.filter(i => !!i).length;
				const n = ni.filter(i => !!i).length;
				if (o > n) {
					return 'REMOVE';
				} else {
					return 'ADD';
				}
			case 'Tiling':
				if (_get(this.originBackgroundInfo, 'backgroundTiling.image') && !_get(this.background_info, 'backgroundTiling.image')) {
					return 'REMOVE';
				} else {
					return 'ADD';
				}
			case 'Video':
				if (_get(this.originBackgroundInfo, 'backgroundVideo.image') && !_get(this.background_info, 'backgroundVideo.image')) {
					return 'REMOVE';
				} else {
					return 'ADD';
				}
		}
	}

	onDragOver(e) {
		e.preventDefault();
		(this.resultImage.nativeElement as HTMLElement).style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		(this.resultImage.nativeElement as HTMLElement).style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		(this.resultImage.nativeElement as HTMLElement).style.opacity = '1';
		let files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.indexOf('image') >= 0) {
			this.uploadeImages([files[0]]);
		}
	}

	refreshView(loading: boolean = false, text: string = 'Uploading...') {
		this._loading = loading;
		this._loadingText = text;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}

	@HostListener('dragover', ['$event']) onEleDragOver(e) {
		e.preventDefault();
	}

	@HostListener('drop', ['$event']) onEleDrop(e) {
		e.preventDefault();
	}
}
