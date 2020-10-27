import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
	Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';

import { Item, CommonItemContent } from '@app-models/item-info';
import { SurveyMultiTextsInfo } from '@app-models/survey-info';

@Component({
	moduleId: module.id,
	selector: 'survey-multi-texts-item',
	templateUrl: './survey-multi-texts.component.html',
	styleUrls: [
		'../item.component.css',
		'./survey-multi-texts.component.css'
	]
})

export class SurveyMultiTextsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input('item') item : Item;
	@Input('editable') editable = false;
	@Input('editing' ) editing  = false;
	@Input('selected') selected = false;
	@Input('readOnly') readOnly = false;
	@Input('containerWidth') containerWidth: number = 1100;
	@Input('animation') animation: boolean = false;
	@Output('itemChange') itemChange = new EventEmitter<Item>();
	@Output('itemResize') itemResize = new EventEmitter<Box>();

	@ViewChild('multiChoiceContainer') _multiChoiceContainer : ElementRef;
	@ViewChild('questionTitle') _questionTitle: ElementRef;
	@ViewChild('optionContainer') optionContainer: ElementRef;
	@ViewChildren('textLabel') public _textLabels: QueryList<ElementRef>;
	@ViewChild('cloneTitle') cloneTitle: ElementRef;

	public info: SurveyMultiTextsInfo = new SurveyMultiTextsInfo();

	public _linkDragStart = new Rx.Subject<number>();
	public _linkDragEnd = new Rx.Subject<number>();
	public _linkDrag = new Rx.Subject<[number, number]>();
	public _linkIndexChange = new Rx.Subject<number[]>();

	public _subs: Rx.Subscription[] = [];

	public parent: HTMLElement;

	public _changes: boolean = false;
	public min_width: number = 200;
	public container_padding: number = 10 + 5; // padding + border

	// text_width + option_margin_left_right + remove button width + grip width
	public extra_width = 125 + 10 + 35;
	public text_marginTB = 10; // textLabel_margin_top_bottom

	// choice_margin_left_right or dropdown extra_width
	public title_extra_width = 10;
	public max_text_no: number = 0;

	constructor(
		public _elementRef: ElementRef,
		public _changeDetectRef: ChangeDetectorRef,
		public _renderer: Renderer,
		public _sanitizer: DomSanitizer
	) {}

	ngAfterViewInit() {
		this._subs = [
			this._linkIndexChange.subscribe(arr=> {
				this.info.texts = withArray(this.info.texts, ar =>
				arr.forEach((di: number, i: number) => {
					ar[i + di] = this.info.texts[i];
				}));
				this._changes = true;
			}),

			Rx.Observable.merge(
				this._linkDragStart,
				this._linkDragEnd,
				this._linkDrag,
				this._linkIndexChange
			)
			.subscribe(() => {
				this._changeDetectRef.detectChanges();
			})
		];

		setTimeout(() => {
			if (this.editable)
				this.setItemResize();
			else
				this.setResultItemResize();
			this._changes = false;
		},0);
	}

	ngOnInit() {
		this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SurveyMultiTextsInfo>).info.value);
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	setItemResize() {
		this._changes = true;
		// let max_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.title_extra_width;
		// let textLabelElems = this._textLabels.toArray();
		// let max_textWidth = 0;
		// textLabelElems.map((ele,i) => {
		//	 if (i==0) {
		//		 max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
		//		 this.max_text_no = 0;
		//	 }
		//	 else if ((ele.nativeElement as HTMLElement).offsetWidth > max_textWidth) {
		//		 max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
		//		 this.max_text_no = i;
		//	 }
		// });

		// $(this.optionContainer.nativeElement as HTMLElement).css('width', max_textWidth + this.extra_width + this.text_marginTB);

		// let ele_width = max_textWidth + this.extra_width + this.text_marginTB;

		// if (ele_width > max_width)
		//	 max_width = ele_width;
		// let d = this.container_padding + max_width;
		// this.parent.style.width = d + 'px';
		this.setHeight();
	}

	setResultItemResize() {
		let parent_width = this.parent.offsetWidth;
		let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth;
		if (parent_width < title_width)
			$(this._questionTitle.nativeElement).css('width', '100%');
		this.setHeight();
	}

	setHeight() {
		let questionTitleHeight = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
		let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
		if (this.editable)
			this.parent.style.height = questionTitleHeight + optionContainerHeight + this.container_padding + 30 + 'px';
		else
			this.parent.style.height = questionTitleHeight + optionContainerHeight + this.container_padding + 5 + 'px';
	}

	getHTML(text: string): SafeHtml {
		return (this._sanitizer.bypassSecurityTrustHtml(text));
	}

	onAdd(event: MouseEvent) {
		if (!this.editable) return;

		event.stopPropagation();
		event.preventDefault();

		this.editable = false;
		this._changeDetectRef.detectChanges();

		this.info.texts.push('');
		this.editable = true;
		this._changeDetectRef.detectChanges();
		this.setItemResize();
	}

	onRemove(i: number, event: MouseEvent) {
		if (!this.editable) return;
		event.stopPropagation();
		event.preventDefault();
		this.info.texts.splice(i, 1);
		this._changeDetectRef.detectChanges();
		this.setHeight();
	}

	emmitItemChange(extraHeight: number = 0) {
		let content = this.item.content as CommonItemContent<SurveyMultiTextsInfo>;
		let height = this.parent.offsetHeight + 10;

		$(this.cloneTitle.nativeElement).text(this.info.label);
		let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth + this.title_extra_width;
		let clone_height = (this.cloneTitle.nativeElement as HTMLElement).offsetHeight;

		let optionContainerWidth = (this.optionContainer.nativeElement as HTMLElement).offsetWidth;
		let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
		if (clone_width < optionContainerWidth)
			clone_width = optionContainerWidth;

		clone_width += this.container_padding;
		clone_height += optionContainerHeight + this.container_padding + 5;

		let item = this.item
			.setContent(
				content.setInfo(
					Maybe.just(
						this.info
					)
				)
				.setBox(
					content.box
						.setRight(content.box.left + clone_width)
						.setBottom(content.box.top + clone_height)
				)
			);

		setTimeout(() => {
			this.itemChange.emit(item);
		},0);
	}

	onContainerClick(event: MouseEvent) {
		if (this.editing) {
			event.stopPropagation();
		}
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}

	@HostListener('document:mousedown', ['$event'])
	public onClick(event: MouseEvent) {
		const clickedInside = this._elementRef.nativeElement.contains(event.target);
		if (!clickedInside && this._changes) {
			this.emmitItemChange();
		}
	}
}
