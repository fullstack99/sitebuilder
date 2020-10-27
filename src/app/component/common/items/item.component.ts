import {
	Component,
	Input,
	HostBinding,
	Renderer,
	Output,
	EventEmitter,
	OnInit,
	OnChanges,
	SimpleChanges,
	ViewChild,
	trigger,
	state,
	style,
	animate,
	transition,
	ElementRef,
	HostListener,
	ViewChildren
} from '@angular/core';
import {
	get as _get,
	findIndex as _findIndex,
	indexOf as _indexOf
} from 'lodash';
import { Box } from '@app-lib/rect/rect';
import { Maybe } from '@app-lib/maybe/maybe';
import { ImageComponent } from '@app-items/image/image.component';
import { TextComponent } from '@app-items/text/text.component';
import { ItemGroupComponent } from '@app-items/item-group/item-group.component';
import { SlideshowComponent } from '@app-items/slideshow/slideshow.component';
import { NavComponent } from '@app-items/nav/nav.component';
import { ShapeComponent } from '@app-items/shape/shape.component';

import { ButtonComponent } from '@app-items/button/button.component';
import { GalleryComponent } from '@app-items/gallery/gallery.component';
import { PhotoItemComponent } from '@app-items/photo/photo.component';
import { SocialComponent } from '@app-items/social/social.component';

import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
import {
	Item,
	FormItemContent,
	CommonItemContent,
	Link,
	ItemType,
	EcommerceInfo
} from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'item',
	templateUrl: './item.component.html',
	styleUrls: ['./item.component.css'],
	animations: [
		trigger('slideInOut', [
			state(
				'in',
				style({
					transform: 'translate3d(0, 0, 0)'
				})
			),
			state(
				'out',
				style({
					transform: 'translate3d(100%, 0, 0)'
				})
			),
			transition('in => out', animate('400ms ease-in-out')),
			transition('out => in', animate('400ms ease-in-out'))
		])
	]
})
export class ItemComponent implements OnInit, OnChanges {
	@Input() maxWidth: number = 1100;
	@Input() containerWidth: number = 1100;
	@Input() item: Item;
	@Input() editable = false;
	@Input() editing = false;
	@Input() selected = false;
	@Input() processingItem: any = null;
	@Input() items: Item[];
	@Input() readOnly = false;
	@Input() placeholder: string;
	@Input() mobilePageView: boolean = false; // true: mobile, false: default
	@Input() animation: boolean = false;
	@Input() loading: boolean = false;
	@Input() zoomable: boolean = true;
	@Input() parent: string = '';
	@Input() canvasScrollElem: HTMLElement;
	@Input() zoomImg: ElementRef;
	@Input('box') _box: Box;

	@Output() changedUrl = new EventEmitter<string>();
	@Output() itemChange = new EventEmitter<Item>();
	@Output() itemChanged = new EventEmitter<{ command: string, item: Item, prevState: any, newState: any }>();
	@Output() undo = new EventEmitter<void>();
	@Output() itemRemove = new EventEmitter<void>();
	@Output() itemResize = new EventEmitter<Box>();
	@Output() contextLEnable = new EventEmitter<[number, number]>(); // pageX, pageY
	@Output() hasLink = new EventEmitter<boolean>();
	@Output() onlink = new EventEmitter<void>();
	@Output() closeHeader = new EventEmitter<Item>();
	@Output() itemFileDrop = new EventEmitter<File>();
	@Output() fileDrop = new EventEmitter<any>();
	@Output() outLink = new EventEmitter<Link>();
	@Output() scrollTop = new EventEmitter<void>();
	@Output() canvasTool = new EventEmitter<string>();

	@HostBinding('style.left')
	get styleLeft() {
		return this._box.left + 'px';
		// if (this.containerWidth > 500) {
		//		 return this._box.left +'px';
		// }
		// else
		//		 return '';
	}

	@HostBinding('style.top')
	get styleTop() {
		return this._box.top + 'px';
		// if (this.containerWidth > 500) {
		//		 return this._box.top +'px';
		// }
		// else
		//		 return '';
	}

	@HostBinding('style.width')
	get styleWidth() {
		if (this.isSurveyItem())
			return Math.min(710, this._box.width()) + 'px';
		else
			return this._box.width() + 'px';
		// return this._box.width() + 'px';
		// if (this.isSurveyItem(this.item.itemType) || (this.containerWidth < 768 && ['NavItem','GalleryItem'].indexOf(this.item.itemType) >= 0))
		//		 return '100%';
		// else
		//		 return this._box.width() + 'px';
	}

	@HostBinding('style.height')
	get styleHeight() {
		return this._box.height() + 'px';
	}

	@HostBinding('style.position')
	get stylePosition() {
		if (this.isSurveyItem() && !this.editable) {
			return 'relative';
		} else {
			this.setParentMP(true);
			return 'absolute';
		}

		// if (this.isSurveyItem(this.item.itemType) && !this.editable) {
		//		 return 'relative';
		// }
		// else if (this.containerWidth > 500 || (this.containerWidth < 768 && this.item.itemType == 'NavItem')) {
		//		 this.setParentMP(true);
		//		 return 'absolute';
		// }
		// else {
		//		 this.setParentMP(false);
		//		 return 'relative';
		// }
	}

	@HostBinding('style.max-width')
	get styleMaxWdith() {
		if (this.editable) return 'auto';
		else return this._box.width() + 'px';

		// if (this.editable)
		//		 return 'auto';
		// else if (this.containerWidth > 500)
		//		 return this._box.width() + 'px';
		// else
		//		 return '';
	}

	@HostBinding('style.max-height')
	get styleMaxHeight() {
		if (this.editable) return 'auto';
		else if (this.item.itemType == 'FormItem') {
			return this._box.height() + '40px';
		} else {
			return this._box.height() + 'px';
		}
		// if (this.editable)
		//		 return 'auto';
		// else if (this.containerWidth > 500)
		//		 return this._box.height() + 'px';
		// else
		//		 return '';
	}

	@HostBinding('style.padding')
	get styleMargin() {
		return '0px';
		// if (this.containerWidth <= 500)
		//		 return '5px';
	}

	@HostBinding('style.z-index')
	get styleZIndex() {
		// if (this.item.itemType == 'NavItem' || this.selected) return '2';
		if (this.item.itemType == 'NavItem') return '2';
		else return '1';
	}

	// @HostBinding('style.right') get styleRight() {
	//		 if (this.containerWidth <= 500 && this.item.itemType == 'NavItem')
	//				 return '0px';
	// }
	@ViewChild(ImageComponent)
	public _imageComponent: ImageComponent;
	@ViewChild(TextComponent)
	public _textComponent: TextComponent;
	@ViewChild(ItemGroupComponent)
	public _itemGroupComponent: ItemGroupComponent;
	@ViewChild(SlideshowComponent)
	public _slideshowComponent: SlideshowComponent;
	@ViewChild(NavComponent)
	public _navComponent: ItemGroupComponent;
	@ViewChild(ButtonComponent)
	public _buttonComponent: ButtonComponent;
	@ViewChild(GalleryComponent)
	public _galleryComponent: GalleryComponent;
	@ViewChild(PhotoItemComponent)
	public _photoItemComponent: PhotoItemComponent;

	private activeSlideIndex = 0;
	private fileDroppableItemTypes: ItemType[] = ['ImageItem'];
	private hasGripItemTypes: ItemType[] = [
		'AppointmentItem',
		'DonationItem',
		'EventSetupItem',
		'SurveyItem',
		'InvitationItem',
		'PhotoItem',
		// 'SingleTextItem',
		// 'SingleCheckItem'
	];

	get innerComponent(): any {
		return (
			this._imageComponent ||
			this._textComponent ||
			this._itemGroupComponent ||
			this._slideshowComponent ||
			this._navComponent ||
			this._buttonComponent ||
			this._galleryComponent ||
			this._photoItemComponent
		);
	}

	get hasItemLink() {
		let content: any = this.item.content;
		switch (this.item.itemType) {
			case 'ButtonItem':
			case 'ShapeItem':
			case 'ImageItem':
				if (content.link)
					return true;
				return false;
			// case 'GalleryItem':
			// 	if (
			// 		_findIndex(content.info.value.gImages, (g: any) => g.link) > -1
			// 	)
			// 		return true;
			// 	return false;
			// case 'NavItem':
			// 	if (
			// 		_findIndex(content.info.value.gImages, (g: any) => g.link) > -1
			// 	)
			// 		return true;
			// 	return false;
			case 'SlideShowItem':
				if (_get(content, ['info', 'value', 'slides', this.activeSlideIndex, 'link']))
					return true;
		}
		return false;
	}

	get isHoverItem() {
		let content: any = this.item.content;
		switch (this.item.itemType) {
			case 'GalleryItem':
				return true;
		}
		return false;
	}

	get hasHover() {
		let content: any = this.item.content;
		switch (this.item.itemType) {
			case 'GalleryItem':
				return content.info.value.hover;
		}
		return false;
	}

	isSurveyItem() {
		return _indexOf(
			[
				'RatingItem',
				'RankItem',
				'EndSurveyItem',
				'MatrixChoiceItem',
				'DateItem',
				'TimeItem',
				'SurveySingleTextItem',
				'SurveyCommentItem',
				'SurveyMultiChoiceItem',
				'SurveyMultiTextsItem'
			],
			this.item.itemType
		) >= 0
			? true
			: false;
	}

	isQuestion(tool: string) {
		return _indexOf(
			['SurveySingleChoiceItem', 'SurveyMultiChoiceItem', 'SurveyDropdownItem', 'SurveySingleTextItem',
			'RatingStarsItem', 'RatingSliderItem', 'RankDropdownItem',
			'EndSurveyItem','EnterDateItem','EnterTimeItem', 'SurveyCommentItem',
			'MatrixOneChoiceItem','MatrixMultiChoiceItem','MatrixEditableDropdownItem',
			'SurveyMultiTextsItem'], tool) >= 0 ? true : false;
	}

	constructor(
		private appService: AppService,
		private windowService: WindowService,
		private renderer: Renderer,
		public elementRef: ElementRef
	) {}

	ngOnInit() {}

	ngOnChanges(changes: SimpleChanges) {
		const item = changes['item'];
		if (item && item.currentValue) {
			this._box = (item.currentValue as Item).content.box;
		}
	}

	setParentMP(position: boolean = true) {
		// margin-left, padding-top, position=>true : absolute, false : relative
		if (this.editable) return;
		if (position) {
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.marginLeft = '0px';
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.paddingTop = '0px';
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.paddingBottom =
				'0px';
		} else {
			let rotatedBox = this.appService.rotatedPosition(
				this.item.content.box,
				this.appService.getRotation(this.item)
			);
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.marginLeft =
				(rotatedBox.width() - this.item.content.box.width()) / 4 + 'px';
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.paddingTop =
				(rotatedBox.height() - this.item.content.box.height()) / 4 + 'px';
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.paddingBottom =
				(rotatedBox.height() - this.item.content.box.height()) / 4 + 'px';
		}
	}

	onItemChange(item: Item) {
		this.animation = false;
		this.itemChange.emit(item);
	}

	onItemChanged(e: { command: string, prevState: any, newState: any }) {
		this.itemChanged.emit({...e, item: this.item});
	}

	onUndo() {
		this.undo.emit();
	}

	onItemResize(box: Box) {
		this.animation = false;
		if (box.height() >= 20) {
			this._box = box;
			this.itemResize.emit(box);
		} else {
			this._box = box.setBottom(box.top + 20);
		}
		this.item.content.box = this._box;
	}

	onItemRemove() {
		this.itemRemove.emit();
	}

	onSetting(event: MouseEvent) {
		event.stopPropagation();
		this.contextLEnable.emit([event.pageX, event.pageY]);
	}

	onChangeActiveSlideIndex(e) {
		this.activeSlideIndex = e;
		this.appService.activeSlideIndex[this.item.uid] = e;
	}

	onLink(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.onlink.emit();
	}

	onSetHover(event: MouseEvent) {
		event.stopPropagation();
		let info = this.item.content['info'].value;
		info = info.setHover(!info.hover);
		const temp = (this.item.content as any).setInfo(Maybe.just(info));
		this.onItemChange(this.item.setContent(temp));
	}

	onScrollTop(event) {
		this.scrollTop.emit();
	}

	onClose(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.itemRemove.emit();
	}

	onHasLink(event: boolean) {
		this.hasLink.emit(event);
	}

	onOutLink(event: Link) {
		this.outLink.emit(event);
	}

	isVisibleSetting(): boolean {
		if (!this.editable || this.loading) return false;
		if (['SitemapItem'].indexOf(this.item.itemType) >= 0)
			return false;
		if (
			this.item.itemType == 'EcommerceItem' &&
			this.item.content['info'].value.layoutType != 3
		)
			return true;
		if (this.isSurveyItem()) return true;
		return this.selected;
	}

	isGridEcommerceItem(): boolean {
		if (
			this.item.itemType == 'EcommerceItem' &&
			this.item.content['info'].value.layoutType != 3
		)
			return true;
		return false;
	}

	isVisibleClose(): boolean {
		if (
			['AppointmentItem'].indexOf(this.item.itemType) >= 0 ||
			(this.item.itemType == 'EcommerceItem' &&
				this.item.content['info'].value.layoutType != 3)
		)
			return false;
		return true;
	}

	getSeletedItemStyle() {
		if (!this.selected || this.item.locked || !this.editable) return false;
		if (this.isSurveyItem() || this.isQuestion(this.item.itemType))
			return false;
		if (
			this.item.itemType === 'EcommerceItem' &&
			_get(this.item, 'content.info.value.layoutType') != 3
		)
			return false;
		return true;
	}

	isGripItem() {
		if (this.item.locked) return false;
		if (this.hasGripItemTypes.indexOf(this.item.itemType) >= 0) return true;
		if (this.item.itemType == 'FormItem' && _get(this.item, 'content.info.value.formType') !== 'S') return true;
		if (this.item.itemType == 'EcommerceItem') return true;
		return false;
	}

	setElementOpacity(opacity: string) {
		if (this.fileDroppableItemTypes.indexOf(this.item.itemType) < 0) return;
		(this.elementRef.nativeElement as HTMLElement).style.opacity = opacity;
		if (opacity == '1')
			(this.elementRef
				.nativeElement as HTMLElement).parentElement.style.opacity = '1';
	}

	@HostListener('dragover', ['$event'])
	onDragOver(e) {
		if (this.fileDroppableItemTypes.indexOf(this.item.itemType) < 0) return;
		e.preventDefault();
		this.setElementOpacity('0.6');
	}

	@HostListener('dragenter', ['$event'])
	onDragEnter(e) {
		if (this.fileDroppableItemTypes.indexOf(this.item.itemType) < 0) return;
		e.preventDefault();
	}

	@HostListener('dragleave', ['$event'])
	onDragLeave(e) {
		if (this.fileDroppableItemTypes.indexOf(this.item.itemType) < 0) return;
		e.preventDefault();
		this.setElementOpacity('1');
	}

	@HostListener('drop', ['$event'])
	onDrop(e) {
		if (this.fileDroppableItemTypes.indexOf(this.item.itemType) < 0) return;
		e.preventDefault();
		e.stopPropagation();
		this.setElementOpacity('1');

		const files = e.dataTransfer.files;

		if (files.length > 0 && files[0].type.indexOf('image') >= 0) {
			this.itemFileDrop.emit(files[0]);
		}
	}
}
