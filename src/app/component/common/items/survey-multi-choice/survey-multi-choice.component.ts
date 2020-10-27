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

import { createLinkAnswerDialogWindow } from '@app-dialogs/link-answer-dialog/link-answer-dialog.component';

import { Item, CommonItemContent } from '@app-models/item-info';
import { SurveyMultiChoiceInfo, Branch } from '@app-models/survey-info';

import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
@Component({
    moduleId: module.id,
    selector: 'survey-multi-choice',
    templateUrl: './survey-multi-choice.component.html',
    styleUrls: [
        './survey-multi-choice.component.css',
        '../item.component.css'
    ]
})

export class SurveyMultiChoiceComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() item : Item;
    @Input() editable = false;
    @Input() editing  = false;
    @Input() selected = false;
    @Input() readOnly = false;
    @Input() containerWidth: number = 1100;
    @Input() animation: boolean = false;

    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();

    @ViewChild('multiChoiceContainer') _multiChoiceContainer : ElementRef;
    @ViewChild('questionTitle') _questionTitle: ElementRef;
    @ViewChild('optionContainer') optionContainer: ElementRef;
    @ViewChildren('textLabel') public _textLabels: QueryList<ElementRef>;
    @ViewChild('cloneTitle') cloneTitle: ElementRef;

    public info: SurveyMultiChoiceInfo = new SurveyMultiChoiceInfo();

    public _linkDragStart = new Rx.Subject<number>();
    public _linkDragEnd = new Rx.Subject<number>();
    public _linkDrag = new Rx.Subject<[number, number]>();
    public _linkIndexChange = new Rx.Subject<number[]>();

    public _subs: Rx.Subscription[] = [];

    public parent: HTMLElement;

    public _changes: boolean = false;

    public min_width: number = 200;
    public container_padding: number = 10 + 5; // padding + border

    // option_width + option_margin_right + remove button width + grip width
    public extra_width = 15 + 10 + 35;
    public text_marginTB = 10; // textLabel_margin_top_bottom

    // choice_margin_left_right or dropdown extra_width
    public title_extra_width = 10;
    public max_textWidth = 110;

    branches: Branch[] = [];
    forceChange: boolean = false;

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer,
        private _appService: AppService,
        private _windowService: WindowService
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
        if (this.editable)
          this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SurveyMultiChoiceInfo>).info.value);
        else
          this.info = (this.item.content as CommonItemContent<SurveyMultiChoiceInfo>).info.value;

        if (this.info.texts.length > 0 && this.info.texts[0].text == undefined) {
          this.info.texts = this.info.texts.map((t: any) => {
            return {text: t, type: '', value: false, link: ''};
          })
        }

        delete this.info['skip'];
        delete this.info['values'];

        if (this._appService._surveyInfo) {
          this.branches = this._appService._surveyInfo.branches;
        }

    }

    ngOnChanges(changes: SimpleChanges) {
    }

    onChangeTextLabel(i, e) {
      this.info.texts[i].text = e;
      this.setItemResize();
    }

    setItemResize() {
        this._changes = true;
        let parent_width = this.parent.offsetWidth;
        let max_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;

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

        this.parent.style.width = this.container_padding + max_width + 'px';
        this.setHeight();
    }

    setResultItemResize() {
        let parent_width = this.parent.offsetWidth;
        let title_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth + this.container_padding;
        if (parent_width < title_width)
            $(this._questionTitle.nativeElement).css('width', '100%');
    }

    setHeight() {
        let titleHeight = (this._questionTitle.nativeElement as HTMLElement).offsetHeight;
        let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
        let extraHeight = this.info.type == 'dropdown' ? 30 : 0;
        this.parent.style.height = titleHeight + optionContainerHeight + this.container_padding + 30 + extraHeight + 'px';
    }

    getHTML(text: string): SafeHtml {
		  return (this._sanitizer.bypassSecurityTrustHtml(text));
    }

    onSetOption(n: number) {
      console.log('lllll', n)
        this.info.texts[n].value = !this.info.texts[n].value;
        if (this.editable) {
            this._changes = true;
            this.emmitItemChange();
        } else {
          if (this.info.texts[n].link && this.info.texts[n].link) {
            const ele = document.getElementById('branch_' + this.info.texts[n].link);
            if (ele) {
              ele.scrollIntoView(true);
            }
          }

        }
        // else if (this.info.values[n]=='1' && this.info.skip[n]) {
        //     if (this.info.skip[n].branch=='current') {

        //     }
        //     else if (this.info.skip[n].branch=='end') {

        //     }
        //     else {
        //         document.getElementById(this.info.skip[n].branch+this.info.skip[n].question).scrollIntoView();
        //     }
        // }
    }

    onAdd(event: MouseEvent, type: string = '') { // type: ''=>default, 'other'=>'other'
        if (!this.editable) return;

        event.stopPropagation();
        event.preventDefault();

        this.editable = false;
        this._changeDetectRef.detectChanges();

        this.info.texts.push({text: '', type: type, value: false, link: null});
        this.editable = true;
        this._changeDetectRef.detectChanges();
        this.setItemResize();
    }

    onRemove(i: number, event: MouseEvent) {
        if (!this.editable)
          return;
        event.stopPropagation();
        event.preventDefault();

        this.info.texts.splice(i, 1);
        this.forceChange = !this.forceChange;
        this.editable = false;
        this._changeDetectRef.detectChanges();

        this.editable = true;
        this._changeDetectRef.detectChanges();
        setTimeout(() => {
          this.setItemResize();
        });
        // this.setHeight();
    }

    emmitItemChange(extraHeight: number = 0) {
        const noOthers = this.info.texts.filter(t=>t.type!='other').length;
        let content = this.item.content as CommonItemContent<SurveyMultiChoiceInfo>;

        if (!this._questionTitle)
          return;

        $(this._questionTitle.nativeElement).text(this.info.label);
        let clone_width = (this._questionTitle.nativeElement as HTMLElement).offsetWidth;
        let clone_height = (this._questionTitle.nativeElement as HTMLElement).offsetHeight - 10;
        let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
        let height = clone_height + optionContainerHeight + this.container_padding - 10 * noOthers;

        if (clone_width < this.parent.offsetWidth)
            clone_width = this.parent.offsetWidth;

        clone_width += this.container_padding;
        if (this.info.type=='dropdown')
            height = clone_height + 50;

        let item = this.item
            .setContent(
                content.setInfo(
                    Maybe.just(this.info)
                )
                .setBox(
                    content.box
                        .setRight(content.box.left + clone_width)
                        .setBottom(content.box.top + height + extraHeight)
                )
            );
        setTimeout(() => {
            this.itemChange.emit(item);
        },0);
    }

    onOpenLinkAnswerDialogWindow(item: {text: string, link: any}) {
      let dialog = createLinkAnswerDialogWindow(this._windowService, item);
      dialog.componentRef.instance.submit.subscribe((res: Branch) => {
        item.link = res.name;
        this._changes = true;
        this.emmitItemChange();
      })
      dialog.open();
    }

    onContainerMousedown(event: MouseEvent) {
      event.stopPropagation();
    }

    onContainerClick(event: MouseEvent) {
      event.stopPropagation();
    }

    onMousedownLink(event: MouseEvent) {
      event.stopPropagation();
      event.preventDefault();
    }

    onClickLink(event: MouseEvent, item) {
      event.stopPropagation();
      event.preventDefault();
      this.onOpenLinkAnswerDialogWindow(item);
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
