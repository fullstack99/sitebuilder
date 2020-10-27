// import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
//	 OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding, HostListener
// } from '@angular/core';
// import * as lodash from 'lodash';
// import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
// import { Maybe } from '@app-common/lib/maybe/maybe';
// import { Box } from '@app-common/lib/rect/rect';
// import { Item, CommonItemContent, SingleTextInfo } from '@app-models/index';


// @Component({
//	 moduleId: module.id,
//	 selector: 'single-text-item',
//	 templateUrl: './single-text.component.html',
//	 styleUrls: ['./single-text.component.css']
// })
// export class SingleTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//	 @Input() item	 : Item;
//	 @Input() editable = false;
//	 @Input() editing  = false;
//	 @Input() readOnly = false;
//	 @Input() containerWidth: number = 1100;

//	 @Output() itemChange = new EventEmitter<Item>();
//	 @Output() itemResize = new EventEmitter<Box>();

//	 @ViewChild('resizableContainer') _resizableContainer: ElementRef;
//	 @ViewChild('singleTextLabel') singleTextLabel: ElementRef;
//	 @ViewChild('textEditorElem') textEditorElem: ElementRef;

//	 padding_width = 40;

//	 public info: SingleTextInfo = new SingleTextInfo;
//	 public parent: HTMLElement;
//	 public _changes: boolean = false;

//	 constructor(
//		 public elementRef: ElementRef,
//		 public changeDetectRef: ChangeDetectorRef,
//		 public renderer: Renderer,
//		 public sanitizer: DomSanitizer
//	 ) {}

//	 ngAfterViewInit() {
//		 let text_width = this.info.textBox.width();

//		 if (this.textEditorElem) {
//			 (this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
//		 }

//		 (this._resizableContainer.nativeElement as HTMLElement).style.width = text_width + 'px';
//		 (this._resizableContainer.nativeElement as HTMLElement).style.height = (this.singleTextLabel.nativeElement as HTMLElement).style.height;

//	 }

//	 ngOnInit() {
//		 this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
//		 this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SingleTextInfo>).info.value);
//	 }

//	 ngOnChanges(changes: SimpleChanges) {
//	 }

//	 onEditorInput(text: string) {
//		 this.info.label = text;
//		 this.setItemResize();
//	 }

//	 onEditorDestroyed(text: string) {
//	 }

//	 onItemResize(event: Box) {
//		 (this._resizableContainer.nativeElement as HTMLElement).style.width = event.width() + 'px';
//		 this.setItemResize();
//	 }

//	 onItemResizeEnd(event: Box) {
//	 }

//	 setItemResize() {
//		 this._changes = true;
//		 let label_width = (this.singleTextLabel.nativeElement as HTMLElement).offsetWidth;
//		 let text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth;
//		 let label_height = (this.singleTextLabel.nativeElement as HTMLElement).offsetHeight;
//		 let parent_width = this.parent.offsetWidth;

//		 let d = this.padding_width + label_width + text_width - parent_width;
//		 this.parent.style.width = parent_width + d + 'px';
//		 this.parent.style.height = label_height + 10 + 'px';
//	 }

//	 emmitItemChange() {
//		 let content = this.item.content as CommonItemContent<SingleTextInfo>;
//		 let text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth;

//		 let item = this.item
//			 .setContent(
//				 content.setInfo(
//					 Maybe.just(
//						 this.info.setTextBox(content.info.value.textBox.setRight(text_width))
//					 )
//				 )
//				 .setBox(content.box.
//					 setRight(content.box.left + this.parent.offsetWidth)
//					 .setBottom(content.box.top + this.parent.offsetHeight)
//				 )
//		 );
//		 this.itemChange.emit(item);
//	 }

//	 isEmpty() {
//		 return ($(this.info.label).text().trim() == '') ? true : false;
//	 }

//	 ngOnDestroy() {
//	 }

//	 @HostListener('document:click', ['$event.target'])
//	 public onClick(targetElement: any) {
//		 const clickedInside = this.elementRef.nativeElement.contains(targetElement);
//		 if (!clickedInside && this._changes && (event.target as HTMLElement).closest('.mce-container') == null) {
//			 this.emmitItemChange();
//		 }
//	 }
// }

import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding, HostListener
} from '@angular/core';
import * as lodash from 'lodash';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent, SingleTextInfo } from '@app/models';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
	moduleId: module.id,
	selector: 'single-text-item',
	templateUrl: './single-text.component.html',
	styleUrls: ['./single-text.component.css']
})
export class SingleTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input() item	 : Item;
	@Input() editable = false;
	@Input() selected: boolean = false;
	@Input() editing  = false;
	@Input() readOnly = false;
	@Input() containerWidth: number = 1100;

	@Output() itemChange = new EventEmitter<Item>();
	@Output() itemResize = new EventEmitter<Box>();

	@ViewChild('singleTextLabel') singleTextLabel: ElementRef;
	@ViewChild('textEditorElem') textEditorElem: ElementRef;
	@ViewChild('singleTextContainer') singleTextContainer: ElementRef;

	private padding_width = 20;
	private textMinWidth = 50;

	public info: SingleTextInfo = new SingleTextInfo;
	public parent: HTMLElement;
	public uid: string = '';
	public labelEditable = false;

	private _viewInited = false;

	constructor(
		private elementRef: ElementRef,
		private changeDetectRef: ChangeDetectorRef,
		private renderer: Renderer,
		private sanitizer: DomSanitizer
	) {}

	ngAfterViewInit() {
		if (this.textEditorElem && this.info.type != 1) {
			(this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
		}
		setTimeout(() => {
			this.setItemResize();
		});
	}

	ngOnInit() {
		this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.info = (this.item.content as CommonItemContent<SingleTextInfo>).info.value;
		this.uid = this.item.uid != '' ? this.item.uid : UUID.UUID();
		this._viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {
	  const selected = changes['selected'];

	  if (selected && !selected.currentValue) {
		if (this._viewInited) {
		  this.labelEditable = false;
		  // this.changeDetectRef.detectChanges();
		}
	  }
	}

	onEditorInput(text: string) {
		this.info.label = text;
		this.setItemResize();
	}

	setItemResize() {
		if (this.info.type == 2) {
			let parent_width = this.parent.offsetWidth;
			let label_width = (this.singleTextLabel.nativeElement as HTMLElement).offsetWidth;
			let label_height = (this.singleTextLabel.nativeElement as HTMLElement).offsetHeight;
			let text_width = (this.singleTextContainer.nativeElement as HTMLElement).offsetWidth;

			let d = label_width + this.padding_width + text_width;
			if (d > parent_width) {
				this.parent.style.width = d + 'px';
				this.item.content.box.right = this.item.content.box.left + d;
			}
			this.item.content.box.bottom = this.item.content.box.top + label_height + 10;
			this.parent.style.height = label_height + 10 + 'px';
		}
		else if (this.info.type == 3) {
			let minHeight = 100;
			let minWidth = 120;
			let label_width = Math.max((this.singleTextLabel.nativeElement as HTMLElement).offsetWidth + 10, minWidth);
			let label_height = Math.max((this.singleTextLabel.nativeElement as HTMLElement).offsetHeight + 60, minHeight);
			let parent_width = this.parent.offsetWidth;
			let parent_height = this.parent.offsetHeight;

			if (label_width > parent_width) {
				this.parent.style.width = label_width + 'px';
				this.item.content.box.right = this.item.content.box.left + label_width;
			}

			if (label_height > parent_height) {
				this.item.content.box.bottom = this.item.content.box.top + label_height;
				this.parent.style.height = label_height + 'px';
			}
		} else {
			let label_height = (this.singleTextContainer.nativeElement as HTMLElement).offsetHeight;
			this.item.content.box.bottom = this.item.content.box.top + label_height + 10;
			this.parent.style.height = label_height + 10 + 'px';
		}
	}

	onClickLabel(e: MouseEvent) {
		if (this.selected && this.editable) {
			this.labelEditable = true;
		}
	}

	onClick(event: MouseEvent) {
		event.stopPropagation();
	}

	isEmpty() {
		return ($(this.info.label).text().trim() == '') ? true : false;
	}

	ngOnDestroy() {
	}
}

