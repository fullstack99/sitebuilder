import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ViewChildren, ElementRef, HostListener, Input, QueryList, AfterViewInit, Renderer } from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
  SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { CommonCanvasComponent } from '@app-common/common-canvas/common-canvas.component';
import { Item, ItemContent,
	ImageItemContent, TextItemContent, ItemGroupContent,
	FormItemContent, CommonItemContent } from '@app-models/item-info';
import { Page, FormInfo, SingleTextInfo, MultipleChoiceInfo } from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createFormDialogWindow(
  windowService: WindowService,
  itemContent: ItemContent,
  width = 950,
  height = 650
): DialogWindow<FormDialogComponent> {
  return windowService.create<FormDialogComponent>(
	FormDialogComponent,
	{
		width: width,
		height: height,
		modal: true,
		draggable: false,
		resizable: true,
		scrollable: false,
		visible: false,
		title: false
	}
	).changeInputs((comp, window) => {
		comp.itemContent = <FormItemContent>itemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}


export interface CanvasTool {
	name: string;
	caption: string;
	activate: boolean;
	item_class: string;
	hasImage: boolean;
	url: string;
}

@Component({
	moduleId: module.id,
	templateUrl: './form-dialog.component.html',
	styleUrls: [
	'./form-dialog.component.css',
	'../../../../../assets/styles/canvas-nav.css']
})
export class FormDialogComponent implements OnInit, OnDestroy, AfterViewInit{

	@Input() itemContent: FormItemContent = new FormItemContent();
	@Output() submit = new EventEmitter<FormItemContent>();
	@Output() close = new EventEmitter<void>();

	@ViewChild('usefulSwiper') public usefulSwiper: any;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;
	@ViewChild(CommonCanvasComponent) public _commonCanvas: CommonCanvasComponent;

	@ViewChild('textEle') _text: ElementRef;

	public document: Page = new Page();
	public formName: string = '';
	public dialogLeft: number = 0;
	public dialogTop: number = 0;

	public dispRange = lodash.range(0, 4);
	public _tools: CanvasTool[] = [
		{ name: 'Required', caption: 'Required', activate: true, item_class: 'required', hasImage: false, url: '' },
		{ name: 'ImageItem', caption: 'Image', activate: true, item_class: 'font-icon btb bt-camera', hasImage: false, url: '' },
		{ name: 'TextItem', caption: 'Text', activate: true, item_class: 'img-responsive', hasImage: true, url: '/assets/images/canvas/text.png' },
		{ name: 'Link', caption: 'Link', activate: true, item_class: 'font-icon btb bt-link', hasImage: false, url: '' },
		{ name: 'ButtonItem', caption: 'Button', activate: true, item_class: 'font-icon btb bt-checkbox-intermediate', hasImage: false, url: '' },
		{ name: 'Background', caption: 'Background', activate: true, item_class: 'font-icon btb bt-photo', hasImage: false, url: '' },
		{ name: 'Border', caption: 'Border', activate: true, item_class: 'img-responsive border', hasImage: true, url: '/assets/images/canvas/border.png' },
	];

	_activeIndex: number = 0;
	isBeginning: boolean = true;
	isEnd: boolean = false;

	public swiperConfig: SwiperConfigInterface = {
		direction: 'horizontal',
		observer: true,
		initialSlide: -1,
		slidesPerView: "auto",
		grabCursor: true
  };
  
  viewMode = 1; // 1: laptop, 2: mobile
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private windowService: WindowService,
		private sanitizer: DomSanitizer,
		private renderer: Renderer
	) { }

	ngOnInit() {
		this.dialogLeft = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.left.split('px')[0]));
    this.dialogTop = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.top.split('px')[0]));

    const dialogWidth = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.width.split('px')[0]));
    
    if (dialogWidth < 420) {
      this.viewMode = 2;
    }

		const left = this.itemContent.box.width() < 850 ? Math.floor((850 - this.itemContent.box.width()) / 2) + 2 : 2;

		let box = lodash.get(this.itemContent, 'info.value.box', new Box(left, left + 300, 50, 200));
		box = (box as Box).moveBy(-2, -2);

		let items: Item[] = this.itemContent.items;
		const dropDownItem = items.filter(item => item.itemType === 'MultiChoiceItem' && (item.content as CommonItemContent<MultipleChoiceInfo>).info.value.type=='dropdown');
		dropDownItem.map(dItem=> {
			let dContent = dItem.content as CommonItemContent<MultipleChoiceInfo>;
			items = items.map(i=> {
			if (i.content.box.top > dContent.box.top && i.content.box.left < dContent.box.right)
			  return i.setContent(i.content.setBox(i.content.box.moveBy(0, dContent.info.value.totalBox.height() - 50)));
			else
			  return i;
			});
		});

		this.document.items = items.map(i => i.setContent(i.content.setBox(i.content.box.moveBy(box.left, box.top))));
		this.formName = this.itemContent.info.value.formName;
	}

	ngAfterViewInit() {
    this.viewInited = true;
		this.subs = [
			this._commonCanvas.history.value.subscribe(r=> {
        if (this._commonCanvas.resultItems.length>0 && !this._commonCanvas._gridImage)
          this._commonCanvas.clickCanvasTool('ShowGrid');
        this.refreshView();
			})
		];
		setTimeout(() => {
			(this._text.nativeElement as HTMLElement).focus();
			this.directiveRef.update();
		},500);
	}

	refresh() {
		setTimeout(() => {
			this.changeDetector.detectChanges();
		});
	}

  public get isSaving(): boolean {
	let result: boolean = false;
	if (this._commonCanvas.items) {
	  let items = this._commonCanvas.items;
	  if (items.length > 0 && this.formName) {
		result = true;
	  }
	}
	return result;
  }

	clickCanvasTool(tool: string) {
		this._commonCanvas.clickCanvasTool(tool);
		this.refresh();
	}

	canActiveTool(tool: string): boolean {
		const someItems = (items: Item[], pred: (item: Item) => boolean) => {
		const go: (item: Item) => boolean = (item: Item) =>
			item.content instanceof ItemGroupContent
			? item.content.items.some(go)
			: pred(item);

		return items.some(go);
	};

	const itemTypeInSelection = (type: string) =>
			someItems(this._commonCanvas.currentState.selectedItems, i => i.itemType == type);

		switch (tool) {
			case 'Undo':
				return this._commonCanvas.isActiveUndo;
			case 'Redo':
				return this._commonCanvas.isActiveRedo;
			case 'required':
				let sItem = this._commonCanvas.selectedItem;
				if (sItem && ['SingleTextItem', 'SingleText1Item'].indexOf(sItem.itemType) >=0 && (sItem.content as CommonItemContent<SingleTextInfo>).info.value.required)
					return true;
			default:
				return itemTypeInSelection(tool);
		}
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');
		feedbackWindow.open();
	}

	onSubmit(event: MouseEvent) {
		if (!this.isSaving) {
			return;
		}

		let items: Item[] = [];
		items = Object.assign([], [], this._commonCanvas.items);
		items = lodash.sortBy(items,'content.box.top');
		const box = Box.boundingBox(items.map(item => item.content.box));

		let dropDownItem = items.filter(item=>item.itemType == 'MultiChoiceItem' && (item.content as CommonItemContent<MultipleChoiceInfo>).info.value.type=='dropdown');
		dropDownItem.map(dItem => {
			const dContent = dItem.content as CommonItemContent<MultipleChoiceInfo>;
			items = items.map(i => {
			if (i.content.box.top > dContent.box.top && i.content.box.left < dContent.box.right)
			return i.setContent(i.content.setBox(i.content.box.moveBy(0, - dContent.info.value.totalBox.height() + 50)));
			else
			return i;
			});
		});

		setTimeout(() => {
			const info = new FormInfo(this.formName, '', box.value);
			this.itemContent =
			this.itemContent
			.setInfo(new Maybe(info))
			.setItems(items);
			this.submit.emit(this.itemContent);
		}, 500);
  	}

	indexChanged(event: number) {
		this.isBeginning = (event == 0);
		this.isEnd = (event == this._tools.length-2);
		this._activeIndex = event;
		this.refreshView();
	}

	onNext() {
		this.directiveRef.nextSlide();
		this.refreshView();
	}

	onPrev() {
		this.directiveRef.prevSlide();
		this.refreshView();
	}

	refreshView() {
		if (this.viewInited)
			this.changeDetector.detectChanges();
		}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
