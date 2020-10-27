import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
    HostListener, trigger, state, style, animate, transition
} from '@angular/core';

import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';

import { Item, CommonItemContent } from '@app-models/item-info';
import { SurveyCommentInfo } from '@app-models/survey-info';

@Component({
    moduleId: module.id,
    selector: 'survey-comment-item',
    templateUrl: './survey-comment.component.html',
    styleUrls: [
        './survey-comment.component.css',
        '../item.component.css'
    ]
})
export class SurveyCommentComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() item     : Item;
    @Input() editable = false;
    @Input() editing  = false;
    @Input() readOnly = false;
    @Input() animation: boolean = false;
    @Input() containerWidth: number = 1100;

    @Output() itemChange = new EventEmitter<Item>();
    @Output() itemResize = new EventEmitter<Box>();

    @ViewChild('resizableContainer') _resizableContainer: ElementRef;
    @ViewChild('questionTitle') _questionTitle: ElementRef;
    @ViewChild('resultText') resultText: ElementRef;
    @ViewChild('cloneTitle') cloneTitle: ElementRef;

    public container_padding: number = 10 + 5; // padding + border

    // textarea_margin_left + textContainer_margin_left_right
    public extra_width = 5 + 20;

    public info: SurveyCommentInfo = new SurveyCommentInfo();
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
            let text_height = this.info.commentBox.height();
            (this._resizableContainer.nativeElement as HTMLElement).style.width = this.info.commentBox.width() + 'px';
            (this._resizableContainer.nativeElement as HTMLElement).style.height = text_height + 'px';
            setTimeout(() => {
                this.setItemResize();
                this._changes = false;
            },0);
        }
        else {
            this.setResultItemResize();
            this._changes = false;
        }
    }

    ngOnInit() {
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        if (this.editable)
          this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SurveyCommentInfo>).info.value);
        else
          this.info = (this.item.content as CommonItemContent<SurveyCommentInfo>).info.value;
    }

    ngOnChanges(changes: SimpleChanges) {
        // let text_width = this.info.commentBox.width();
        // if (this.containerWidth > (text_width + 10))
        //     (this.resultText.nativeElement as HTMLElement).style.width = text_width + 'px';
        // else
        //     (this.resultText.nativeElement as HTMLElement).style.width = '100%';
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
        let text_height = (this._resizableContainer.nativeElement as HTMLElement).offsetHeight;
        let label_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        let text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth + this.container_padding + this.extra_width;
        let label_height = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
        let d = ((label_width > text_width) ? label_width : text_width);
        let h = label_height + text_height + this.container_padding + 10;
        this.parent.style.width = d + 'px';
        this.parent.style.height = h + 'px';
    }

    setResultItemResize() {
        let text_height = this.info.commentBox.height();
        (this.resultText.nativeElement as HTMLElement).style.height = text_height + 'px';
        if ((this.parent.offsetWidth - 20) < this.info.commentBox.width())
            (this.resultText.nativeElement as HTMLElement).style.width = 'calc(100% - 20px)';
        else
            (this.resultText.nativeElement as HTMLElement).style.width = this.info.commentBox.width() + 'px';

        let label_height = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
        let h = label_height + text_height + this.container_padding + 10;
        this.parent.style.height = h + 'px';
    }

    emmitItemChange() {
        let content = this.item.content as CommonItemContent<SurveyCommentInfo>;
        $(this.cloneTitle.nativeElement).text(this.info.label);
        let clone_width = (this.cloneTitle.nativeElement as HTMLElement).offsetWidth;
        let clone_height = (this.cloneTitle.nativeElement as HTMLElement).offsetHeight;

        let text_width = (this._resizableContainer.nativeElement as HTMLElement).offsetWidth;
        let text_height = (this._resizableContainer.nativeElement as HTMLElement).offsetHeight;

        if (clone_width < text_width + this.extra_width)
            clone_width = text_width + this.extra_width;

        clone_width += this.container_padding;
        clone_height += text_height + this.container_padding + 10;

        let item = this.item
            .setContent(
                content.setInfo(
                    Maybe.just(
                        this.info
                            .setCommentBox(
                                this.info.commentBox
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
    public onMouseDown(event: MouseEvent) {
        const clickedInside = this._elementRef.nativeElement.contains(event.target);
        if (!clickedInside && this._changes) {
            this.emmitItemChange();
        }
    }
}
