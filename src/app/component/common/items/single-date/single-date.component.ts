import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
    Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent } from '@app-models/item-info';
import { SingleDateInfo } from '@app-models/form-info';

@Component({
    moduleId: module.id,
    selector: 'single-date-item',
    templateUrl: './single-date.component.html',
    styleUrls: [
        './single-date.component.css',
        '../item.component.css'
    ]
})

export class SingleDateComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input('item') item : Item;
    @Input('editable') editable = false;
    @Input('selected') selected = false;
    @Input('readOnly') readOnly = false;
    @Input('containerWidth') containerWidth: number = 1100;

    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();

    @ViewChild('optionContainer') optionContainer: ElementRef;
    @ViewChild('textLabel') textLabelEle: ElementRef;

    public info: SingleDateInfo = new SingleDateInfo();

    public _subs: Rx.Subscription[] = [];

    public parent: HTMLElement;

    public _changes: boolean = false;

    public container_padding: number = 10 + 5; // padding + border

    // textContainer_margin_left_right + margin + dropWidth
    public extra_width = 10 + 40 + 150;
    public min_width: number = 260;
    public max_textWidth = 120;
    // public model: Object[] = [{ date: { year: 2017, month: 7, day: 6 } }];

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SingleDateInfo>).info.value);
    }

    ngAfterViewInit() {
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this._subs = [
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    setItemResize() {
        this._changes = true;
        const w = (this.textLabelEle.nativeElement as HTMLElement).offsetWidth;
        const h = (this.textLabelEle.nativeElement as HTMLElement).offsetHeight;
        $(this.optionContainer.nativeElement as HTMLElement).css('width', this.max_textWidth + this.extra_width);

        let d = this.container_padding + w;

        if (d > this.min_width) {
          this.parent.style.width = d + 'px';
        }

        if (h > this.item.content.box.height()) {
          this.parent.style.height = `${h + 4}px`;
        }

    }

    getHTML(text: string): SafeHtml {
      return (this._sanitizer.bypassSecurityTrustHtml(text));
    }

    emmitItemChange(extraHeight: number = 0) {
        let content = this.item.content as CommonItemContent<SingleDateInfo>;

        let optionContainerWidth = (this.optionContainer.nativeElement as HTMLElement).offsetWidth;
        let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;

        let item = this.item
            .setContent(
                content.setInfo(
                    Maybe.just(
                        this.info
                    )
                )
                .setBox(
                    content.box
                        .setRight(content.box.left + optionContainerWidth)
                        .setBottom(content.box.top + optionContainerHeight + 4)

                )
            );

        setTimeout(() => {
            this.itemChange.emit(item);
        },0);
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
