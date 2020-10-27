import { Component, Input, HostBinding, Output, EventEmitter, OnChanges, SimpleChanges,
	ViewChild, ChangeDetectionStrategy, trigger, state, style, animate, transition, ElementRef
  } from '@angular/core';
import * as lodash from 'lodash';

import { Box } from '@app-lib/rect/rect';

import { ImageComponent } from '@app-items/image/image.component';
import { ItemGroupComponent } from '@app-items/item-group/item-group.component';
import { SlideshowComponent } from '@app-items/slideshow/slideshow.component';
import { NavComponent } from '@app-items/nav/nav.component';
import { ShapeComponent } from '@app-items/shape/shape.component';
import { VideoComponent } from '@app-items/video/video.component';
import { ButtonComponent } from '@app-items/button/button.component';
import { GalleryComponent } from '@app-items/gallery/gallery.component';

import { AttentionInfo, DispStr, Item, FormItemContent, CommonItemContent } from '@app/models';
import { AppService } from '@app/app.service';

@Component({
	moduleId   : module.id,
	selector   : 'link-item',
	templateUrl: './link-item.component.html',
	styleUrls  : ['./item.component.css'],
	animations: [
		trigger('slideInOut', [
			state('in', style({
				transform: 'translate3d(0, 0, 0)'
			})),
			state('out', style({
				transform: 'translate3d(100%, 0, 0)'
			})),
			transition('in => out', animate('400ms ease-in-out')),
			transition('out => in', animate('400ms ease-in-out'))
		]),
	]
})
// export class LinkItemComponent implements OnChanges {
//	 @Input('maxWidth') maxWidth: number = 1100;
//	 @Input('containerWidth') containerWidth: number = 1100;
//	 @Input('item') item: Item;

//	 @HostBinding('style.left') get styleLeft() {
//		 if (this._box.width() < this.containerWidth)
//			 return this._box.left * this.containerWidth / this.maxWidth + 'px';
//		 else
//			 return '';
//	 }

//	 @HostBinding('style.top') get styleTop() {
//		 if (this._box.width() < this.containerWidth)
//			 //return this._box.top + 'px';
//			 return this._box.top * this.containerWidth / this.maxWidth + 'px';
//		 else
//			 return '';
//	 }

//	 @HostBinding('style.width') get styleWidth() {
//		 if (this.isSurveyItem(this.item.itemType))
//			 return '100%';
//		 else if (this.item.itemType == 'HFItem')
//			 return 'calc(100% - 42px)';
//		 else if (lodash.indexOf(['ButtonItem'], this.item.itemType) >= 0)
//			 return this._box.width() + 'px';
//		 else if (this._box.width() < this.containerWidth)
//			 //return this._box.width() + 'px';
//			 return this._box.width() * this.containerWidth / this.maxWidth + 'px';
//		 else
//			 return '100%';
//	 }

//	 @HostBinding('style.height') get styleHeight() {
//		 if (lodash.indexOf(['ButtonItem'], this.item.itemType) >= 0)
//			 return this._box.height() + 'px';
//		 else if (this._box.width() < this.containerWidth)
//			 //return this._box.height() + 'px';
//			 return this._box.height() * this.containerWidth / this.maxWidth + 'px';
//		 else
//			 return 'auto';
//	 }

//	 @HostBinding('style.position') get stylePosition() {
//		 if (this.isSurveyItem(this.item.itemType))
//			 return 'relative';
//		 else if (this._box.width() < this.containerWidth && this.containerWidth > 500)
//			 return 'absolute';
//		 else
//			 return 'relative';
//	 }
//	 @HostBinding('style.max-width') get styleMaxWdith() {
//		 return this._box.width() + 'px';
//	 }
//	 @HostBinding('style.max-height') get styleMaxHeight() {
//		 return this._box.height() + 'px';
//	 }

//	 get hasLink() {
//		 let content: any = this.item.content;
//		 if (content.link && content.link.target) return true;
//		 return false;
//	 }

//	 public _box: Box;

//	 isSurveyItem(itemType: string) {
//	 return lodash.indexOf(
//		 [ 'RatingItem', 'RankItem', 'EndSurveyItem', 'MatrixChoiceItem', 'DateItem', 'TimeItem',
//			 'SurveySingleTextItem', 'SurveyCommentItem', 'SurveyMultiChoiceItem',
//			 'SurveyMultiTextsItem'], itemType) >= 0 ? true : false;
//	 }

//	 constructor(
//	 ) {}

//	 ngOnChanges(changes: SimpleChanges) {
//		 const item = changes['item'];
//		 if (item && item.currentValue) {
//			 this._box = (item.currentValue as Item).content.box;
//		 }
//	 }
// }

export class LinkItemComponent implements OnChanges {
	@Input('maxWidth') maxWidth: number = 1100;
	@Input('containerWidth') containerWidth: number = 1100;
	@Input('item') item: Item;
	@Input() mobilePageView: boolean = false; // true: mobile, false: default

	@HostBinding('style.left') get styleLeft() {
		return this._box.left +'px';
	}

	@HostBinding('style.top') get styleTop() {
		return this._box.top +'px';
	}

	@HostBinding('style.width') get styleWidth() {
		if (this.isSurveyItem(this.item.itemType))
			return '100%';
		else
			return this._box.width() + 'px';
	}

	@HostBinding('style.height') get styleHeight() {
		return this._box.height() + 'px';
	}

	@HostBinding('style.position') get stylePosition() {
		if (this.isSurveyItem(this.item.itemType)) {
			return 'relative';
		}
		else {
			this.setParentMP(true);
			return 'absolute';
		}
	}

	@HostBinding('style.max-width') get styleMaxWdith() {
		return this._box.width() + 'px';
	}

	@HostBinding('style.max-height') get styleMaxHeight() {
		return this._box.height() + 'px';
	}

	@HostBinding('style.padding') get styleMargin() {
		return '0px';
	}

	@HostBinding('style.z-index') get styleZIndex() {
		if (this.item.itemType == 'NavItem')
			return '10';
		else
			return '1';
	}

	get hasItemLink() {
		let content: any = this.item.content;
		switch(this.item.itemType) {
			case 'ButtonItem':
			case 'ShapeItem':
			case 'ImageItem':
				if (content.link) return true;
				return false;
			case 'GalleryItem':
				if (lodash.findIndex(content.info.value.gImages,((g: any) =>g.link))>-1) return true;
				return false;
			case 'NavItem':
				if (lodash.findIndex(content.info.value.gImages,((g: any) =>g.link))>-1) return true;
				return false;
			case 'SlideShowItem':
				if (lodash.findIndex(content.info.value.slides,((g: any) =>g.link))>-1) return true;
				return false;
		}
	}

	public _box: Box;

	isSurveyItem(itemType: string) {
		return lodash.indexOf(
			[ 'RatingItem', 'RankItem', 'EndSurveyItem', 'MatrixChoiceItem', 'DateItem', 'TimeItem',
			 'SurveySingleTextItem', 'SurveyCommentItem', 'SurveyMultiChoiceItem',
			 'SurveyMultiTextsItem'], itemType) >= 0 ? true : false;
	}

	isServiceItem(itemType: string) {
		return lodash.indexOf(['EventSetupItem', 'DonationItem', 'SurveyItem'], itemType) >= 0 ? true : false;
	}

	constructor(
			public _elementRef: ElementRef,
			public _appService: AppService,
		) {}

	ngOnChanges(changes: SimpleChanges) {
		const item = changes['item'];
		if (item && item.currentValue) {
			this._box = (item.currentValue as Item).content.box;
		}
	}

	setParentMP(position: boolean = true) { // margin-left, padding-top, position=>true : absolute, false : relative
		if (position) {
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.marginLeft = '0px';
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.paddingTop = '0px';
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.paddingBottom = '0px';
		}
		else {
			let rotatedBox = this._appService.rotatedPosition(this.item.content.box, this._appService.getRotation(this.item));
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.marginLeft = (rotatedBox.width() - this.item.content.box.width())/4 + 'px';
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.paddingTop = (rotatedBox.height() - this.item.content.box.height())/4 + 'px';
			(this._elementRef.nativeElement as HTMLElement).parentElement.style.paddingBottom = (rotatedBox.height() - this.item.content.box.height())/4 + 'px';
		}
	}

}

