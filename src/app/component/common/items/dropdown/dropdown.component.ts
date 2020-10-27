import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
	Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
} from '@angular/core';

import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { Item, CommonItemContent, DropdownInfo } from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'dropdown-item',
	templateUrl: './dropdown.component.html',
	styleUrls: ['./dropdown.component.css']
})

export class DropdownItemComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input('item') item : Item;
	@Input('editable') editable = false;
	@Input('editing' ) editing  = false;
	@Input('selected') selected = false;
	@Output('itemChange') itemChange = new EventEmitter<Item>();
	@Output('itemResize') itemResize = new EventEmitter<Box>();

	@ViewChild('multiChoiceContainer') _multiChoiceContainer: ElementRef;
	@ViewChild('choiceLabel') _choiceLabel: ElementRef;
	@ViewChild('optionContainer') optionContainer: ElementRef;
	@ViewChild('textEditorElem') textEditorElem: ElementRef;
	@ViewChildren('textLabel') public _textLabels: QueryList<ElementRef>;
	@ViewChildren('subTextEditorElem') public subTextEditorElems: QueryList<ElementRef>;

	private parent: HTMLElement;
	public info: DropdownInfo = new DropdownInfo;

	public _linkDragStart = new Rx.Subject<number>();
	public _linkDragEnd = new Rx.Subject<number>();
	public _linkDrag = new Rx.Subject<[number, number]>();
	public _linkIndexChange = new Rx.Subject<number[]>();
	public _startEdit = new Rx.Subject<number>();
	public _stopEdit = new Rx.Subject<void>();

	public editingIndex: number = -2;
	public min_width: number = 200;
	public container_padding: number = 10 + 5; // padding + border

	// option_width + option_margin_right + remove button width + grip width
	public extra_width = 15 + 5 + 35;
	public text_marginTB = 10; // textLabel_margin_top_bottom

	// choice_margin_left_right or dropdown extra_width
	public choice_extra_width = 10;
	public max_textWidth = 110;

	private changed: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetectRef: ChangeDetectorRef,
		private renderer: Renderer,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		this.info = (this.item.content as CommonItemContent<DropdownInfo>).info.value;

		this.subs = [
			this._linkIndexChange.subscribe(arr => {
				this.info.values = withArray(this.info.values, ar =>
				arr.forEach((di: number, i: number) => {
					ar[i + di] = this.info.values[i];
				}));
			}),

			this._startEdit.subscribe(r=> {
				this.editingIndex = r;
				this.changeDetectRef.detectChanges();
				this.setText();
			}),
			this._stopEdit.subscribe(r=> {
				this.editingIndex = null;
				this.changeDetectRef.detectChanges();
				this.setText();
			}),

			Rx.Observable.merge(
				this._linkDragStart,
				this._linkIndexChange
			)
			.subscribe(() => {
				this.changed = true;
				this.changeDetectRef.detectChanges();
				this.setText();
			}),

			Rx.Observable.merge(
				this._linkDragEnd,
				this._linkDrag
			)
			.subscribe(() => {
				this.changeDetectRef.detectChanges();
			})
		];
	}

	ngAfterViewInit() {
		this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.choice_extra_width = 30;

		setTimeout(() => {
			this.setText();
		});
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	setActive(event: MouseEvent, i: number = -1) {
		if (!this.editing) return;
		event.stopPropagation();
		event.preventDefault();

		if (this.editingIndex != i) {
			this._stopEdit.next();
		}
		this._startEdit.next(i);
	}

	editEnable(i: number) {
		if (this.editingIndex == i)
			return true;
		return false;
	}

	setText() {
		if (this.info.label.trim()) {
			(this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
		}
		else
			(this.textEditorElem.nativeElement as HTMLElement).innerHTML = '<p><span style="font-size: 14px;">&nbsp;</span></p>';

		let subTextElems = this.subTextEditorElems.toArray();
		subTextElems.forEach((ele,i) => {
			if ($(this.info.values[i]).text().trim())
				(ele.nativeElement as HTMLElement).innerHTML = this.info.values[i];
			else
				(ele.nativeElement as HTMLElement).innerHTML = '<p><span style="font-size: 14px;">&nbsp;</span></p>';
		});

	}

	onEditorInput(text: string, n: number = -1) {
		if (this.editingIndex != n) return;
		this.changed = true;

		if (n==-1) {
			this.info.label = text;
		}
		else {
		   this.info.values[n] = text;
		}
	}

	setItemResize() {
		let parent_width = this.parent.offsetWidth;
		let max_width = (this._choiceLabel.nativeElement as HTMLElement).offsetWidth + this.choice_extra_width;
		let textLabelElems = this._textLabels.toArray();

		textLabelElems.map((ele,i) => {
			if (i==0)
				this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
			else if ((ele.nativeElement as HTMLElement).offsetWidth > this.max_textWidth)
				this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
		});

		this.renderer.setElementStyle(this.optionContainer.nativeElement, 'width', this.max_textWidth + this.extra_width + this.text_marginTB + 'px');

		let ele_width = this.max_textWidth + this.extra_width + this.text_marginTB;

		if (ele_width > max_width)
			max_width = ele_width;

		let d = this.container_padding + max_width;

		if (d > this.min_width)
			this.parent.style.width = d + 'px';

		this.setHeight();
	}

	setHeight() {
		let choiceLabelHeight = (this._choiceLabel.nativeElement as HTMLElement).offsetHeight;
		let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
		if (this.editable)
			this.renderer.setElementStyle(this.parent, 'height', choiceLabelHeight + optionContainerHeight + this.container_padding + 30 + 'px');
		else
			this.renderer.setElementStyle(this.parent, 'height', choiceLabelHeight + optionContainerHeight + this.container_padding + 5 + 'px');
	}

	getHTML(text: string): SafeHtml {
		return (this.sanitizer.bypassSecurityTrustHtml(text));
	}

	onAdd(event: MouseEvent) {
		if (!this.editable) return;
		event.stopPropagation();
		event.preventDefault();
		this._stopEdit.next();
		let parent_height = this.parent.offsetHeight;
		this.info.values.push('<p><span style="font-size: 14px;">&nbsp;</span></p>');
		this.changeDetectRef.detectChanges();
		this._stopEdit.next();
	}

	onRemove(i: number, event: MouseEvent) {
		if (!this.editable) return;
		event.stopPropagation();
		event.preventDefault();
		this.info.values.splice(i, 1);
		this.changeDetectRef.detectChanges();
		this.setHeight();
	}

	isEmpty(i: number = -1) {
		if (i == -1) {
			return (this.editingIndex != i && $(this.info.label).text().trim()=='') ? true : false;
		}
		else {
			return (this.editingIndex != i && $(this.info.values[i]).text().trim()=='') ? true : false;
		}
	}

	onContainerClick(event: MouseEvent) {
		if (this.editing) {
			event.stopPropagation();
		}
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
