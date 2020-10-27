import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
	ChangeDetectionStrategy, HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';

import { Item, CommonItemContent } from '@app-models/item-info';
import { SurveySingleTextInfo } from '@app-models/survey-info';

@Component({
	moduleId: module.id,
	selector: 'survey-single-text-item',
	templateUrl: './survey-single-text.component.html',
	styleUrls: [
		'./survey-single-text.component.css',
		'../item.component.css'
	]
})
export class SurveySingleTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input() item	 : Item;
	@Input() editable = true;
	@Input() selected: boolean = false;
	@Input() editing  = false;
	@Input() readOnly = false;
	@Input() containerWidth: number = 1100;
	@Input() animation: boolean = false;
	@Output() itemChange = new EventEmitter<Item>();
	@Output() itemResize = new EventEmitter<Box>();

	@ViewChild('resizableContainer') _resizableContainer: ElementRef;
	@ViewChild('singleTextLabel') _singleTextLabel: ElementRef;
	@ViewChild('resultText') resultText: ElementRef;
	@ViewChild('cloneTitle') cloneTitle: ElementRef;

	public container_padding: number = 10 + 5; // padding + border

	// textarea_margin_left + textContainer_margin_left_right
	public extra_width = 5 + 5;

	public info: SurveySingleTextInfo = new SurveySingleTextInfo();
	public parent: HTMLElement;

	public _label: string = '';
	public _box: Box;
	public _changes: boolean = false;

	constructor(
		public _elementRef: ElementRef,
		public _changeDetectRef: ChangeDetectorRef,
		public _renderer: Renderer,
		public _sanitizer: DomSanitizer
	) {}

	ngAfterViewInit() {
		if (this.editable) {
			let text_height = this.info.textBox.height();
			(this._resizableContainer.nativeElement as HTMLElement).style.width = this.info.textBox.width() + 'px';
			(this._resizableContainer.nativeElement as HTMLElement).style.height = text_height + 'px';
			setTimeout(() => {
				this.setItemResize();
				this._changes = false;
			}, 0);
		} else {
			setTimeout(() => {
				this.setResultItemResize();
			});
			this._changes = false;
		}
	}

	ngOnInit() {
		this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SurveySingleTextInfo>).info.value);
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	onItemResize(event: Box) {
		(this._resizableContainer.nativeElement as HTMLElement).style.width = event.width() + 'px';
		(this._resizableContainer.nativeElement as HTMLElement).style.height = event.height() + 'px';
		this.setItemResize();
	}

	onItemResizeEnd(event: Box) {
	}

	setItemResize() {
		this._changes = true;
		const text_height = (this._resizableContainer.nativeElement as HTMLElement).offsetHeight;
		const label_width = (this._singleTextLabel.nativeElement as HTMLElement).offsetWidth + this.container_padding;
		const text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth + this.container_padding + this.extra_width;
		const label_height = (this._singleTextLabel.nativeElement as HTMLElement).offsetHeight;
		const d = ((label_width > text_width) ? label_width : text_width);
		const h = label_height + text_height + this.container_padding + 10;
		this.parent.style.width = d + 'px';
		this.parent.style.height = h + 'px';
	}

	setResultItemResize() {
		const text_height = this.info.textBox.height();
		(this.resultText.nativeElement as HTMLElement).style.height = text_height + 'px';
		
		if (this.parent.offsetWidth && (this.parent.offsetWidth - 5) < this.info.textBox.width())
			(this.resultText.nativeElement as HTMLElement).style.width = 'calc(100% - 5px)';
		else
			(this.resultText.nativeElement as HTMLElement).style.width = this.info.textBox.width() + 'px';

		const label_height = (this._singleTextLabel.nativeElement as HTMLElement).offsetHeight;
		const h = label_height + text_height + this.container_padding + 10;
		console.log(label_height, text_height)
		this.parent.style.height = h + 'px';
	}

	emmitItemChange() {
		let content = this.item.content as CommonItemContent<SurveySingleTextInfo>;
		$(this.cloneTitle.nativeElement).text(this.info.label);
		let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth;
		let clone_height = (this.cloneTitle.nativeElement as HTMLElement).offsetHeight;

		const text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth;
		const text_height = (this._resizableContainer.nativeElement as HTMLElement).offsetHeight;

		if (clone_width < text_width + this.extra_width)
			clone_width = text_width + this.extra_width;

		clone_width += this.container_padding;
		clone_height += text_height + this.container_padding + 10;

		const item = this.item
			.setContent(
				content.setInfo(
					Maybe.just(
						this.info
							.setTextBox(
								this.info.textBox
									.setRight(text_width)
									.setBottom(text_height)
								)
					)
				)
				.setBox(
					content.box
						.setRight(content.box.left + clone_width)
						.setBottom(content.box.top + clone_height)
				)
			 );
		this.itemChange.emit(item);
	}

	ngOnDestroy() {
	}

	@HostListener('document:mousedown', ['$event'])
	public onClick(event: MouseEvent) {
		const clickedInside = this._elementRef.nativeElement.contains(event.target);
		if (!clickedInside && this._changes) {
			console.log('ooooooo')
			this.emmitItemChange();
		}
	}
}
