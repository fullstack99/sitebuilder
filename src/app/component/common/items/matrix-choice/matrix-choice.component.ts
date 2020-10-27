import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
    Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';
import { ancestors } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { Item, CommonItemContent } from '@app-models/item-info';
import { MatrixChoiceInfo } from '@app-models/survey-info';

@Component({
    moduleId: module.id,
    selector: 'matrix-choice-item',
    templateUrl: './matrix-choice.component.html',
    styleUrls: [
        './matrix-choice.component.css',
        '../item.component.css'
    ]
})

export class MatrixChoiceComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input('item') item : Item;
    @Input('editable') editable = false;
    @Input('editing' ) editing  = false;
    @Input('selected') selected = false;
    @Input('readOnly') readOnly = false;
    @Input('animation') animation: boolean = false;
    @Input('containerWidth') containerWidth: number = 1100;
    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();

    @ViewChild('matrixChoiceContainer') _matrixChoiceContainer : ElementRef;
    @ViewChild('questionTitle') _questionTitle: ElementRef;
    @ViewChild('hTextContainer') hTextContainerElem: ElementRef;
    @ViewChild('vTextContainer') vTextContainerElem: ElementRef;
    @ViewChild('cloneTitle') cloneTitle: ElementRef;

    public info: MatrixChoiceInfo = new MatrixChoiceInfo();

    public _hLinkDragStart = new Rx.Subject<number>();
    public _hLinkDragEnd = new Rx.Subject<number>();
    public _hLinkDrag = new Rx.Subject<[number, number]>();
    public _hLinkIndexChange = new Rx.Subject<number[]>();
    public _vLinkDragStart = new Rx.Subject<number>();
    public _vLinkDragEnd = new Rx.Subject<number>();
    public _vLinkDrag = new Rx.Subject<[number, number]>();
    public _vLinkIndexChange = new Rx.Subject<number[]>();

    public _subs: Rx.Subscription[] = [];

    public parent: HTMLElement;

    public _changes: boolean = false;
    public text_width: number = 162;

    public container_padding: number = 10 + 5; // padding + border
    public text_marginTB = 10; // textLabel_margin_top_bottom

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.info = lodash.cloneDeep((this.item.content as CommonItemContent<MatrixChoiceInfo>).info.value);

    }

    ngAfterViewInit() {
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this._subs = [
            this._hLinkIndexChange.subscribe(arr=> {
                this.info.htexts = withArray(this.info.htexts, ar =>
                arr.forEach((di: number, i: number) => {
                  ar[i + di] = this.info.htexts[i];
                }));
                this._changes = true;
            }),
            this._vLinkIndexChange.subscribe(arr=> {
                this.info.vtexts = withArray(this.info.vtexts, ar =>
                arr.forEach((di: number, i: number) => {
                  ar[i + di] = this.info.vtexts[i];
                }));
                this._changes = true;
            }),

            Rx.Observable.merge(
                this._hLinkDragStart,
                this._hLinkDragEnd,
                this._hLinkDrag,
                this._hLinkIndexChange,
                this._vLinkDragStart,
                this._vLinkDragEnd,
                this._vLinkDrag,
                this._vLinkIndexChange
            )
            .subscribe((i) => {
                this._changeDetectRef.detectChanges();
                this.setItemResize();
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

    setItemResize() {
        this._changes = true;
        // let parent_width = this.parent.offsetWidth;
        // let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        // let h_width = this.text_width * (this.info.htexts.length + 1) + this.container_padding + 30 + 50;
        // this.parent.style.width = Math.max(title_width, h_width) + 'px';
        this.setHeight();
    }

    setResultItemResize() {
        // let parent_width = this.parent.offsetWidth;
        // let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        // let title_height = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
        // let h_width = this.text_width * (this.info.htexts.length + 1) + this.container_padding
        // let width = Math.max(title_width, h_width);
        // if (parent_width < title_width)
        //     $(this._questionTitle.nativeElement).css('width', '100%');
        this.setHeight();
    }

    setHeight() {
        let titleHeight = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
        let optionContainerHeight = (this.hTextContainerElem.nativeElement as HTMLElement).offsetHeight + (this.vTextContainerElem.nativeElement as HTMLElement).offsetHeight;
        this.parent.style.height = titleHeight + optionContainerHeight + this.container_padding + 'px';
    }

    getHTML(text: string): SafeHtml {
		return (this._sanitizer.bypassSecurityTrustHtml(text));
	}

    onAdd(event: MouseEvent, rc: number = 0) {
        if (!this.editable) return;
        event.stopPropagation();
        event.preventDefault();

        this.editable = false;
        this._changeDetectRef.detectChanges();

        if (rc==0) {
            for(let i=0; i<this.info.vtexts.length;i++) {
                this.info.values.splice(this.info.htexts.length*(i+1)+i,0,['','']);
                this.info.selectedValues.splice(this.info.htexts.length*(i+1)+i,0,'');
            }
            this.info.htexts.push('');
        }
        else {
            for(let i=0; i<this.info.htexts.length;i++) {
                this.info.values.push(['','']);
                this.info.selectedValues.push('');
            }
            this.info.vtexts.push('');
        }

        this.editable = true;
        this._changeDetectRef.detectChanges();
        this.setItemResize();
    }

    onRemove(event: MouseEvent, i: number, rc: number = 0) {
        console.log(this.editable, rc);
        if (!this.editable) return;
        event.stopPropagation();
        event.preventDefault();
        if (rc==0) {
            this.info.values = this.info.values.filter((value,n) =>!(n % this.info.htexts.length==i));
            this.info.selectedValues = this.info.selectedValues.filter((value,n) =>!(n % this.info.htexts.length==i));
            this.info.htexts.splice(i, 1);
        }
        else {
            this.info.vtexts.splice(i, 1);
            this.info.values = this.info.values.splice(this.info.htexts.length*i,this.info.htexts.length);
            this.info.selectedValues = this.info.selectedValues.splice(this.info.htexts.length*i,this.info.htexts.length);
        }
        this._changeDetectRef.detectChanges();
        this.setItemResize();
    }

    changeElements(event: string[], i: number, j: number) {
        this._changes = true;
        this.info.values[this.info.htexts.length*i+j] = event;
    }

    onRemoveDropdown(event: MouseEvent, i: number, j: number) {
        event.stopPropagation();
        event.preventDefault();
        this._changes = true;
        this._changeDetectRef.detectChanges();
        setTimeout(() => {
            this.info.values[this.info.htexts.length*i+j] = ['',''];
            this.info.selectedValues[this.info.htexts.length*i+j] = '';
            this._changeDetectRef.detectChanges();
        },0);
    }

    emmitItemChange(extraHeight: number = 0) {
        let content = this.item.content as CommonItemContent<MatrixChoiceInfo>;
        $(this.cloneTitle.nativeElement).text(this.info.label);
        let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth;
        let clone_height = (this.cloneTitle.nativeElement as HTMLElement).offsetHeight;
        let optionContainerHeight = (this.hTextContainerElem.nativeElement as HTMLElement).offsetHeight + (this.vTextContainerElem.nativeElement as HTMLElement).offsetHeight;

        if (clone_width < this.parent.offsetWidth)
            clone_width = this.parent.offsetWidth;

        clone_width += this.container_padding;
        clone_height += optionContainerHeight + this.container_padding -30;

        let item = this.item
            .setContent(
                content.setInfo(
                    Maybe.just(this.info)
                )
                .setBox(
                    content.box
                        .setRight(content.box.left + clone_width)
                        .setBottom(content.box.top + clone_height + extraHeight)
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
