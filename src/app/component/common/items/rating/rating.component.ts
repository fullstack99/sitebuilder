import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { RatingInfo } from '@app-models/survey-info';
import { Item, CommonItemContent } from '@app-models/item-info';

@Component({
    moduleId: module.id,
    selector: 'rating-item',
    templateUrl: './rating.component.html',
    styleUrls: [
        './rating.component.css',
        '../item.component.css'
    ]
})
export class RatingComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input('item'    ) item     : Item;
    @Input('editable') editable = false;
    @Input('editing' ) editing  = false;
    @Input('readOnly') readOnly = false;
    @Input('containerWidth') containerWidth: number = 1100;
    @Input('animation') animation: boolean = false;
    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();

    @ViewChild('questionTitle') _questionTitle: ElementRef;
    @ViewChild('cloneTitle') cloneTitle: ElementRef;
    @ViewChild('ratingContainer') ratingContainer: ElementRef;

    public info: RatingInfo = new RatingInfo();
    public parent: HTMLElement;
    public _changes: boolean = false;

    public _rangeRating: number[]=[0, 9];
    public _ratingStarRange = lodash.range(0,5);
    public _ratingValue: number = 1;
    public _rating = new FormControl(1);
    public rating = new FormControl(1); // result rating for preview

    public ratingWH: number[]=[0,0];
    public container_padding: number = 10 + 5; // padding + border
    public text_marginTB = 15 // textLabel_margin_top_bottom

    public _subs: Rx.Subscription[] = [];

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}

    ngAfterViewInit() {
        setTimeout(() => {
            this.ratingWH=[(this.ratingContainer.nativeElement as HTMLElement).offsetWidth + 30, (this.ratingContainer.nativeElement as HTMLElement).offsetHeight + 10];
            this.setItemResize();
            this._changes = false;
        },0);
    }

    ngOnInit() {
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this.info = lodash.cloneDeep((this.item.content as CommonItemContent<RatingInfo>).info.value);
        this._rating.setValue(this.info.rate);
        this._ratingValue = this.info.rate + 1;
        this._subs=[
            this._rating.valueChanges.subscribe((n: number) => {
                this._ratingValue = Math.floor(n + 1);
                this.info.rate = this._ratingValue - 1;
                this._changeDetectRef.detectChanges();
            })
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    setRate(event: MouseEvent, n: number) {
        this._ratingValue = n;
        this._changeDetectRef.detectChanges();
    }

    setItemResize() {
        this._changes = true;
        let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        let title_height = (this._questionTitle.nativeElement as HTMLElement).offsetHeight + this.text_marginTB;
        $(this.parent).css('width', ((title_width > this.ratingWH[0]) ? title_width : this.ratingWH[0]) + 'px');
        $(this.parent).css('height', title_height + this.ratingWH[1] + 'px');
    }

    setResultItemResize() {
        // let parent_width = this.parent.offsetWidth;
        // let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        // let width = Math.max(title_width, h_width);
        // if (parent_width < title_width)
        //     $(this._questionTitle.nativeElement).css('width', '100%');
        // this.setHeight();
    }

    emmitItemChange() {
        let content = this.item.content as CommonItemContent<RatingInfo>;
        $(this.cloneTitle.nativeElement).text(this.info.label);
        let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth;
        let clone_height = (this.cloneTitle.nativeElement as HTMLElement).offsetHeight + this.text_marginTB + this.ratingWH[1];

        if (clone_width < this.ratingWH[0])
            clone_width = this.ratingWH[0];

        clone_width += this.container_padding;

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
        this.itemChange.emit(item);
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
