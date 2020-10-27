import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit,
		 Renderer, Host, OnChanges, SimpleChanges, ElementRef, ViewChild, Renderer2, ViewChildren, QueryList,
	   } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { Box } from '@app-lib/rect/rect';
import { Page, Item, ItemContent, ItemGroupContent, TextItemContent, BackgroundInfo, BorderInfo } from '@app/models';

import { ItemComponent } from '@app-common/items/item.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

/**  */
export function createPickItemDialogComponentWindow(
	windowService: WindowService,
	page: Page = null
): DialogWindow<PickItemDialogComponent> {
	return windowService.create<PickItemDialogComponent>(
		PickItemDialogComponent,
		{
			width: 1030,
			height: 540,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	)
	.changeInputs((comp, window) => {
		if (page)
			comp.page = page;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector   : 'pick-item-dialog',
	templateUrl: 'pick-item-dialog.component.html',
	styleUrls: ['pick-item-dialog.component.css']
})

export class PickItemDialogComponent implements OnInit, AfterViewInit {

	@Input('page') page: Page = new Page;
	@Input() maxWidth = 1100;
	@Input() containerWidth = 1100;
	@Input() pageLayout = 1; // 1: Tablet, 2: mobile
	@Input() minHeaderHeight = 100;
	@Input() minBodyHeight = 250;
	@Input() minFooterHeight = 100;

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<Item>();
	
	public elem: HTMLElement;
	public canvasHPadding = 10;
	public loading = false;
	public items: Item[] = [];  
	public resultHF1Items: Item[] = [null, null];
	public resultItems: any = [[], [], []];
	public canvasScrollTop = 0;
	public bodyBackgroundImageHeight = 0;
	public headerBackgroundImageHeight = 0;
	public footerBackgroundImageHeight = 0;
	public backgroundImageHeight = 0;

	private prevContainerWidth: number = 1100;
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	@ViewChild('zoomImg') zoomImg: ElementRef;
	@ViewChild('canvasScroll') public _canvasScroll: ElementRef;
	get canvasScrollElem(): HTMLElement {
		return this._canvasScroll ? this._canvasScroll.nativeElement : null;
	}

	@ViewChild('canvas') public _canvas: ElementRef;
	get canvasElem(): HTMLElement {
		return this._canvas ? this._canvas.nativeElement : null;
	}

	@ViewChild('canvasPreHeader') public _canvasPreHeader: ElementRef;
	get canvasPreHeaderElem(): HTMLElement {
		return this._canvasPreHeader ? this._canvasPreHeader.nativeElement : null;
	}

	@ViewChild('canvasHeader') public _canvasHeader: ElementRef;
	get canvasHeaderElem(): HTMLElement {
		return this._canvasHeader ? this._canvasHeader.nativeElement : null;
	}

	@ViewChild('canvasBody') public _canvasBody: ElementRef;
	get canvasBodyElem(): HTMLElement {
		return this._canvasBody ? this._canvasBody.nativeElement : null;
	}

	@ViewChild('canvasFooter') public _canvasFooter: ElementRef;
	get canvasFooterElem(): HTMLElement {
		return this._canvasFooter ? this._canvasFooter.nativeElement : null;
	}

	// @ViewChildren(ItemComponent) public _itemComponents: QueryList<ItemComponent>;

	get canvasFooterBox(): Box {
		const top = this.canvasFooterElem
			? Number(this.canvasFooterElem.style.top.split('px')[0])
			: 0;
		const left = this.canvasFooterElem
			? Number(this.canvasFooterElem.style.left.split('px')[0])
			: 0;
		return new Box(
			left,
			left + this.canvasFooterElem.offsetWidth,
			top,
			top + this.canvasFooterElem.offsetHeight
		);
	}

	public selectedItem : Item;
	public _items: Item[];

	get canvasHeight(): number {
		const item = lodash.maxBy(this._items, i => i.content.box.bottom);
		return item ? item.content.box.bottom + 1 : 0;
	}

	constructor(
		private _changeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef,
		private _renderer: Renderer2,
		private _windowService: WindowService,
		private appService: AppService,
	) {}

	ngOnInit() {
		this.setPage(this.page);
	}

	ngAfterViewInit() {
		this.setCanvasSize();
	}

	setPage(page: Page) {
		this.elem = this._elementRef.nativeElement;
		this.items = lodash.cloneDeep(page.items);
		this.resultHF1Items[0] = this.items.find(
		  	item => item.hf == 1 && item.itemType == 'HFItem'
		);
		this.resultHF1Items[1] = this.items.find(
		  	item => item.hf == 2 && item.itemType == 'HFItem'
		);

		this.resultItems[2] = this.items.filter(
		  	item => item.hf == 1 && item.itemType != 'HFItem' && (['ImageItem', 'TextItem'].indexOf(item.itemType) >= 0)
		);
		this.resultItems[3] = this.items.filter(
		  	item => item.hf == 2 && item.itemType != 'HFItem' && (['ImageItem', 'TextItem'].indexOf(item.itemType) >= 0)
		);

		if (
			this.resultHF1Items[0] &&
			this.resultHF1Items[0].content['visible'] &&
			this.resultItems[2].length > 0
		) {
			this.resultItems[0] = this.items.filter(
				item =>
					item.hf == 0 &&
					item.content.box.bottom <= this.resultHF1Items[0].content.box.top &&
					(['ImageItem', 'TextItem'].indexOf(item.itemType) >= 0)
			);
			this.resultItems[1] = this.items.filter(
				item =>
					item.hf == 0 &&
					item.content.box.top >= this.resultHF1Items[0].content.box.bottom && 
					(['ImageItem', 'TextItem'].indexOf(item.itemType) >= 0)
			);
		} else {
			this.resultItems[0] = [];
			this.resultItems[1] = this.items.filter(item => item.hf == 0 && (['ImageItem', 'TextItem'].indexOf(item.itemType) >= 0));
		}
		this._changeDetector.detectChanges();
	}
	
	setCanvasSize() {
		this._renderer.setStyle(this.canvasElem, 'flex-direction', 'unset');
	
		if (this._canvasHeader && this.resultHF1Items[0]) {
			let headerElem = this._canvasHeader.nativeElement as HTMLElement;
			this._renderer.setStyle(
				headerElem,
				'left',
				this.resultHF1Items[0].content.box.left + 'px'
			);
			this._renderer.setStyle(
				headerElem,
				'top',
				this.resultHF1Items[0].content.box.top + 'px'
			);
			this._renderer.setStyle(
				headerElem,
				'height',
				this.resultHF1Items[0].content.box.height() + 'px'
			);
			this._renderer.setStyle(
				headerElem,
				'min-width',
				this.resultHF1Items[1].content.box.width() + 'px'
			);
		}

		if (
			this.resultHF1Items[1] &&
			this.backgroundImageHeight > this.resultHF1Items[1].content.box.bottom
		) {
			this.resultHF1Items[1].content.box = this.resultHF1Items[1].content.box.moveBy(
				0,
				this.backgroundImageHeight -
				this.resultHF1Items[1].content.box.height() -
				this.canvasHPadding
			);
		}
	
		if (this._canvasFooter && this.resultHF1Items[1]) {
			let maxBottom = Math.max(
				...this.resultItems[1].map(i => i.content.box.bottom),
				this.resultHF1Items[1].content.box.top
			);
			let footerElem = this._canvasFooter.nativeElement as HTMLElement;
			this._renderer.setStyle(
				footerElem,
				'left',
				this.resultHF1Items[1].content.box.left + 'px'
			);
			this._renderer.setStyle(footerElem, 'top', maxBottom + 'px');
			this._renderer.setStyle(
				footerElem,
				'height',
				this.resultHF1Items[1].content.box.height() + 'px'
			);
			this._renderer.setStyle(
				footerElem,
				'min-width',
				this.resultHF1Items[1].content.box.width() + 'px'
			);
		}
		// this._renderer.setStyle(this.canvasBodyElem, 'width', '0px');
	}

	resizeCanvasElem() {
		if (!this.resultHF1Items[1]) return;
		let canvasBottom = this.resultHF1Items[1].content.box.bottom;
		let maxBottom = this.minHeaderHeight + this.minBodyHeight + 2 * this.canvasHPadding;
		this._renderer.setStyle(
			this.canvasElem,
			'height',
			lodash.max([maxBottom, canvasBottom + this.canvasHPadding]) + 'px'
		);
	}

	getHFBackground(hf: number) {
		let backInfo = BackgroundInfo.empty();
		if (this.resultHF1Items[hf]) {
		  	backInfo = this.resultHF1Items[hf].content['backInfo'].value;
		}
		return backInfo;
	}

	getHFBorder(hf: number) {
		let borderInfo = BorderInfo.empty();
		if (this.resultHF1Items[hf]) {
		  	borderInfo = this.resultHF1Items[hf].content['borderInfo'].value;
		}
		return borderInfo;
	}

	getRotation(item: any): number{
		return item.content.rotate ?  item.content.rotate : 0;
	}

	rotatable(item: Item): boolean {
		if (item.locked)
			return false;

		if (lodash.indexOf(['ShapeItem', 'ButtonItem', 'ImageItem'], item.itemType) < 0)
			return false;

		return true;
	}

	// onItemResize(item: Item) {
	// 	setTimeout(() => {
	// 		let itemComponents: ItemComponent[] = [];
	// 		let canvasEle = this.canvasElem;
	// 		let containerItem: Item;
	// 		let box: Box;
	// 		itemComponents = this._itemComponents
	// 			.toArray()
	// 			.filter(i => i.item.hf == item.hf && i.item.itemType != 'HFItem');
	// 		let maxBottom = lodash.max([
	// 			...itemComponents.map(i => this.getItemComponentBottom(i))
	// 		]);
		
	// 		switch (item.hf) {
	// 			case 0:
	// 				break;
	// 			case 1:
	// 				box = this.resultHF1Items[0].content.box;
	// 				this.resultHF1Items[0] = this.resultHF1Items[0].setContent(
	// 					this.resultHF1Items[0].content.setBox(
	// 					box.setBottom(box.top + maxBottom)
	// 					)
	// 				);
	// 				break;
	// 			case 2:
	// 				box = this.resultHF1Items[1].content.box;
	// 				this.resultHF1Items[1] = this.resultHF1Items[1].setContent(
	// 					this.resultHF1Items[1].content.setBox(
	// 					box.setBottom(box.top + maxBottom)
	// 					)
	// 				);
	// 				break;
	// 		}
	// 		this.setCanvasSize();
	// 	});
	// }

	// getItemComponentBottom(ic: ItemComponent) {
	// 	let ele = <HTMLElement>ic.elementRef.nativeElement;
	// 	let angle = this.getRotation(ic.item);
	// 	if (angle != 0) {
	// 		return this.appService.rotatedPosition(
	// 			new Box(
	// 				ele.offsetLeft,
	// 				ele.offsetLeft + ele.offsetWidth,
	// 				ele.offsetTop,
	// 				ele.offsetTop + ele.offsetHeight
	// 			),
	// 			this.getRotation(ic.item)
	// 		).bottom;
	// 	} else {
	// 	  return ele.offsetTop + ele.offsetHeight;
	// 	}
	// }

	onItemClick(item: Item) {
		this.selectedItem = item;
		this._changeDetector.detectChanges();
	}

	openFeedbackDialog() {
		let feedabckWindow = createFeedbackDialogWindow(this._windowService, 'pick-link');
		feedabckWindow.open();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		if (this.selectedItem)
			this.submit.emit(this.selectedItem);
	}
}
