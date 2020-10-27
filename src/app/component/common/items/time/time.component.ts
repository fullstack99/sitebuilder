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
import { Item, CommonItemContent,  TimeInfo } from '@app/models';

@Component({
    moduleId: module.id,
    selector: 'time-item',
    templateUrl: './time.component.html',
    styleUrls: [
        './time.component.css',
        '../item.component.css'
    ]
})

export class TimeComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
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
    
    public info: TimeInfo = new TimeInfo();

    public _linkDragStart = new Rx.Subject<number>();
	public _linkDragEnd = new Rx.Subject<number>();
	public _linkDrag = new Rx.Subject<[number, number]>();
	public _linkIndexChange = new Rx.Subject<number[]>();   

    public _subs: Rx.Subscription[] = [];

    public parent: HTMLElement;
    
    public _changes: boolean = false;    

    public container_padding: number = 10 + 5; // padding + border

    // optionContainer_margin_left + textContainer_margin_left_right + margin + dropWidth
    public extra_width = 20 + 10 + 40 + 120;
    public text_marginTB = 10; // textLabel_margin_top_bottom
    public min_width: number = 260;
    public max_textWidth = 120;   

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}   

    ngOnInit() {        
        this.info = lodash.cloneDeep((this.item.content as CommonItemContent<TimeInfo>).info.value);
    }

    ngAfterViewInit() {        
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this._subs = [
            this._linkIndexChange.subscribe(arr=> {
                this.info.texts = withArray(this.info.texts, ar =>
				arr.forEach((di: number, i: number) => {
					ar[i + di] = this.info.texts[i];
				}));
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

    ngOnChanges(changes: SimpleChanges) {        
    }   
    
    setItemResize() {
        this._changes = true;
        let max_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth;

        if (this.optionContainer) {
            let textLabelElems = this._textLabels.toArray();
            textLabelElems.map((ele,i) => {            
                if (i==0)
                    this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
                else if ((ele.nativeElement as HTMLElement).offsetWidth > this.max_textWidth)
                    this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
            });

            $(this.optionContainer.nativeElement as HTMLElement).css('width', this.max_textWidth + this.extra_width + this.text_marginTB);

            let ele_width = this.max_textWidth + this.extra_width + this.text_marginTB;

            if (ele_width > max_width)
                max_width = ele_width;
        }      
        
        let d = this.container_padding + max_width;

        if (d > this.min_width)
            this.parent.style.width = d + 'px';
        
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
        
        this.editable = true;
        this.info.texts.push('');        
        this.info.times.push(null);
        this._changeDetectRef.detectChanges();
        this.setItemResize();        
    }

    onRemove(event: MouseEvent, i: number) {
        if (!this.editable) return;
        event.stopPropagation();
        event.preventDefault();
        this.info.texts.splice(i, 1);        
        this.info.times.splice(i,1);
        this._changeDetectRef.detectChanges();
        this.setHeight();        
    }   

    emmitItemChange(extraHeight: number = 0) {               
        let content = this.item.content as CommonItemContent<TimeInfo>;        
        let height = this.parent.offsetHeight;

        $(this.cloneTitle.nativeElement).text(this.info.label);
        let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth;
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
                        .setBottom(content.box.top + clone_height + extraHeight)
                )
            );      
        
        setTimeout(() => {
            this.itemChange.emit(item);
        },0);
    }
    
    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }

    @HostListener('document:click', ['$event'])
    public onClick(event: MouseEvent) {
        const clickedInside = this._elementRef.nativeElement.contains(event.target);        
        if (!clickedInside && this._changes) {            
            this.emmitItemChange();
        }
    }
}
