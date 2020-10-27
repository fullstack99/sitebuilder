// import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
//     OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
//     Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
// } from '@angular/core';
// import * as lodash from 'lodash';
// import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
// import * as Rx from 'rxjs/Rx';
// import { ancestors } from '@app-common/lib/dom/dom';
// import { Maybe } from '@app-common/lib/maybe/maybe';
// import { Box } from '@app-common/lib/rect/rect';
// import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-common/lib/array/array';
// import { MultipleChoiceInfo } from '@app-models/form-info';
// import { Item, CommonItemContent } from '@app-models/item-info';

// @Component({
//     moduleId: module.id,
//     selector: 'multiple-choice',
//     templateUrl: './multiple-choice.component.html',
//     styleUrls: ['./multiple-choice.component.css']
// })

// export class MultipleChoiceComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input('item') item : Item;
//     @Input('editable') editable = false;
//     @Input('editing' ) editing  = false;
//     @Input('selected') selected = false;
//     @Output('itemChange') itemChange = new EventEmitter<Item>();
//     @Output('itemResize') itemResize = new EventEmitter<Box>();

//     @ViewChild('multiChoiceContainer') _multiChoiceContainer : ElementRef;
//     @ViewChild('choiceLabel') _choiceLabel: ElementRef;
//     @ViewChild('optionContainer') optionContainer: ElementRef;
//     @ViewChild('textEditorElem') textEditorElem: ElementRef;
//     @ViewChildren('textLabel') public _textLabels: QueryList<ElementRef>;
//     @ViewChildren('subTextEditorElem') public subTextEditorElems: QueryList<ElementRef>;

//     public _linkDragStart = new Rx.Subject<number>();
// 	public _linkDragEnd = new Rx.Subject<number>();
// 	public _linkDrag = new Rx.Subject<[number, number]>();
// 	public _linkIndexChange = new Rx.Subject<number[]>();
//     public _startEdit = new Rx.Subject<number>();
//     public _stopEdit = new Rx.Subject<void>();
//     public _editingIndex: Maybe<number> = Maybe.just(0);

//     public _subs: Rx.Subscription[] = [];

//     public parent: HTMLElement;

//     public info: MultipleChoiceInfo = new MultipleChoiceInfo;
//     public _changes: boolean = false;

//     public min_width: number = 200;

//     public container_padding: number = 10 + 5; // padding + border

//     // option_width + option_margin_right + remove button width + grip width
//     public extra_width = 15 + 5 + 35;
//     public text_marginTB = 10; // textLabel_margin_top_bottom

//     // choice_margin_left_right or dropdown extra_width
//     public choice_extra_width = 10;

//     public max_textWidth = 110;

//     constructor(
//         public elementRef: ElementRef,
//         public changeDetectRef: ChangeDetectorRef,
//         public renderer: Renderer,
//         public sanitizer: DomSanitizer
//     ) {}

//     ngOnInit() {
//         this.info = lodash.cloneDeep((this.item.content as CommonItemContent<MultipleChoiceInfo>).info.value);
//     }

//     ngAfterViewInit() {
//         this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;

//         if (this.info.type != 'dropdown')
//             (this._choiceLabel.nativeElement as HTMLElement).style.width = this.info.labelBox.width() + 'px';

//         if (this.info.type == 'dropdown')
//             this.choice_extra_width = 30;

//         this._subs = [
//             this._linkIndexChange.subscribe(arr=> {
//                 this.info.values = withArray(this.info.values, ar =>
// 				arr.forEach((di: number, i: number) => {
// 					ar[i + di] = this.info.values[i];
// 				}));
//                 this._changes = true;
//             }),

//             this._startEdit.subscribe(r=> {
//                 this._editingIndex = Maybe.just(r);
//                 this.changeDetectRef.detectChanges();
//                 this.setText();
//             }),
//             this._stopEdit.subscribe(r=> {
//                 this._editingIndex = Maybe.nothing();
//                 this.changeDetectRef.detectChanges();
//                 this.setText();
//             }),

//             Rx.Observable.merge(
//                 this._linkDragStart,
//                 this._linkDragEnd,
//                 this._linkDrag,
//                 this._linkIndexChange
//             )
//             .subscribe(() => {
//                 this.changeDetectRef.detectChanges();
//             })
//         ];

//         setTimeout(() => {
//             this.setText();
//         },0);
//     }

//     ngOnChanges(changes: SimpleChanges) {
//     }

//     setActive(event: MouseEvent, i: number = -1) {
//         if (!this.editing) return;
//         event.stopPropagation();
//         event.preventDefault();

//         if (this._editingIndex.value) {
// 			if (this._editingIndex.value != i) {
// 				this._stopEdit.next();
// 			}
// 		}
// 		this._startEdit.next(i);
//         this._changes = true;
//     }

//     editEnable(i: number) {
// 		let result: boolean = false;
// 		this._editingIndex.map(value=> {
// 			if (value !=undefined && value==i) {
//                 result = true;
//             }
// 		});
// 		return result;
// 	}

//     setText() {
//         if (this.info.label.trim()) {
//             (this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
//         }
//         else
//             (this.textEditorElem.nativeElement as HTMLElement).innerHTML = '<p><span style="font-size: 14px;">&nbsp;</span></p>';

//         let subTextElems = this.subTextEditorElems.toArray();
//         subTextElems.map((ele,i) => {
//             if ($(this.info.values[i]).text().trim())
//                 (ele.nativeElement as HTMLElement).innerHTML = this.info.values[i];
//             else
//                 (ele.nativeElement as HTMLElement).innerHTML = '<p><span style="font-size: 14px;">&nbsp;</span></p>';
//         });
//         this.setItemResize();
//     }

//     onEditorInput(text: string, n: number = -1) {
//         if (this._editingIndex.value != n) return;
//         this.setItemResize();
//         this._changes = true;
//     }

//     onEditorDestroyed(text: string, n: number = -1) {
//         if (n==-1) {
//             this.info.label = text;
//         }
//         else {
//            this.info.values[n] = text;
//         }
//     }

//     onItemResize(event: Box) {
//         this._changes = true;
//         (this._choiceLabel.nativeElement as HTMLElement).style.width = event.width() + 'px';
//         this.setItemResize();
//     }

//     onItemResizeEnd(event: Box) {
//     }

//     setItemResize() {
//         let parent_width = this.parent.offsetWidth;
//         let max_width = (this._choiceLabel.nativeElement as HTMLElement).offsetWidth + this.choice_extra_width;
//         let textLabelElems = this._textLabels.toArray();

//         textLabelElems.map((ele,i) => {
//             if (i==0)
//                 this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
//             else if ((ele.nativeElement as HTMLElement).offsetWidth > this.max_textWidth)
//                 this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
//         });

//         $(this.optionContainer.nativeElement as HTMLElement).css('width', this.max_textWidth + this.extra_width + this.text_marginTB);

//         let ele_width = this.max_textWidth + this.extra_width + this.text_marginTB;

//         if (ele_width > max_width)
//             max_width = ele_width;

//         let d = this.container_padding + max_width;

//         if (d > this.min_width)
//             this.parent.style.width = d + 'px';

//         this.setHeight();
//     }

//     setHeight() {
//         let choiceLabelHeight = (this._choiceLabel.nativeElement as HTMLElement).offsetHeight;
//         let optionContainerHeight = (this.optionContainer.nativeElement as HTMLElement).offsetHeight;
//         if (this.editable)
//             this.parent.style.height = choiceLabelHeight + optionContainerHeight + this.container_padding + 30 + 'px';
//         else
//             this.parent.style.height = choiceLabelHeight + optionContainerHeight + this.container_padding + 5 + 'px';
//     }

//     getHTML(text: string): SafeHtml {
// 		return (this.sanitizer.bypassSecurityTrustHtml(text));
// 	}

//     onAdd(event: MouseEvent) {
//         if (!this.editable) return;
//         event.stopPropagation();
//         event.preventDefault();
//         this._stopEdit.next();
//         let parent_height = this.parent.offsetHeight;
//         this.info.values.push('<p><span style="font-size: 14px;">&nbsp;</span></p>');
//         this.changeDetectRef.detectChanges();
//         this._stopEdit.next();
//     }

//     onRemove(i: number, event: MouseEvent) {
//         if (!this.editable) return;
//         event.stopPropagation();
//         event.preventDefault();
//         this.info.values.splice(i, 1);
//         this.changeDetectRef.detectChanges();
//         this.setHeight();
//     }

//     emmitItemChange(extraHeight: number = 0) {
//         let content = this.item.content as CommonItemContent<MultipleChoiceInfo>;
//         let height = 0;

//         height = this.parent.offsetHeight + 10;

//         let totalBox = new Box(0,this.parent.offsetWidth,0,height + extraHeight);

//         if (this.info.type=='dropdown')
//             height = (this._choiceLabel.nativeElement as HTMLElement).offsetHeight + 2;

//         let item = this.item
//             .setContent(
//                 content.setInfo(
//                     Maybe.just(
//                         this.info
//                             .setLabelBox(content.info.value.labelBox
//                                 .setRight(content.info.value.labelBox.left+(this._choiceLabel.nativeElement as HTMLElement).offsetWidth))
//                             .setTotalBox(totalBox)
//                     )
//                 )
//                 .setBox(
//                     content.box
//                         .setRight(content.box.left + this.parent.offsetWidth)
//                         .setBottom(content.box.top + height + extraHeight)
//                 )
//         );

//         setTimeout(() => {
//             this.itemChange.emit(item);
//         },0);
//     }

//     isEmpty(i: number = -1) {
//         if (i == -1) {
//             return (this._editingIndex.value != i && $(this.info.label).text().trim()=='') ? true : false;
//         }
//         else {
//             return (this._editingIndex.value != i && $(this.info.values[i]).text().trim()=='') ? true : false;
//         }
//     }

//     onContainerClick(event: MouseEvent) {
//         if (this.editing) {
//             event.stopPropagation();
//         }
//     }

//     ngOnDestroy() {
//         this._subs.forEach(s => s.unsubscribe());
//     }

//     @HostListener('document:click', ['$event'])
//     public onClick(event: MouseEvent) {
//         const clickedInside = this.elementRef.nativeElement.contains(event.target);
//         if (!clickedInside && this._changes && (event.target as HTMLElement).closest('.mce-container') == null) {
//             this.editing = false;
//             this._stopEdit.next();
//             this.setText();
//             this.emmitItemChange();
//         }
//     }
// }


import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit,
    Renderer, HostBinding, QueryList, ChangeDetectionStrategy, HostListener
} from '@angular/core';
import * as lodash from 'lodash';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import { ancestors } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { Item, CommonItemContent, MultipleChoiceInfo } from '@app/models';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
    moduleId: module.id,
    selector: 'multiple-choice',
    templateUrl: './multiple-choice.component.html',
    styleUrls: ['./multiple-choice.component.css']
})

export class MultipleChoiceComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() item: Item;
    @Input() editable = false;
    @Input() editing  = false;
    @Input() selected = false;
    @Output() itemChange = new EventEmitter<Item>();
    @Output() itemResize = new EventEmitter<Box>();

    @ViewChild('multiChoiceContainer') _multiChoiceContainer : ElementRef;
    @ViewChild('choiceLabel') _choiceLabel: ElementRef;
    @ViewChild('optionContainer') optionContainer: ElementRef;
    @ViewChild('textEditorElem') textEditorElem: ElementRef;
    @ViewChildren('textLabel') public _textLabels: QueryList<ElementRef>;
    @ViewChildren('subTextEditorElem') public subTextEditorElems: QueryList<ElementRef>;

    private parent: HTMLElement;
    public info: MultipleChoiceInfo = new MultipleChoiceInfo;

    public _linkDragStart = new Rx.Subject<number>();
    public _linkDragEnd = new Rx.Subject<number>();
    public _linkDrag = new Rx.Subject<[number, number]>();
    public _linkIndexChange = new Rx.Subject<number[]>();
    public _startEdit = new Rx.Subject<number>();
    public _stopEdit = new Rx.Subject<void>();

    public editingIndex = -2;
    public container_padding = 10 + 5; // padding + border

    // option_width + option_margin_right + remove button width + grip width
    public extra_width = 15 + 5 + 30;
    public text_marginTB = 10; // textLabel_margin_top_bottom

    // choice_margin_left_right or dropdown extra_width
    public choice_extra_width = 30;
    public max_textWidth = 110;

    public uid = '';
    private viewInited = false;
    private changed = false;
    private subs: Rx.Subscription[] = [];

    constructor(
        private elementRef: ElementRef,
        private changeDetectRef: ChangeDetectorRef,
        private renderer: Renderer,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.info = (this.item.content as CommonItemContent<MultipleChoiceInfo>).info.value;
        this.uid = this.item.uid != '' ? this.item.uid : UUID.UUID();
        this.subs = [
            this._linkIndexChange.subscribe(arr=> {
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

            // Rx.Observable.merge(
            //     this._linkDragStart,
            //     this._linkIndexChange
            // )
            // .subscribe(() => {
            //     this.changed = true;
            //     this.changeDetectRef.detectChanges();
            //     this.setText();
            // }),

            Rx.Observable.merge(
              this._linkDragStart,
              this._linkDragEnd,
              this._linkDrag,
              this._linkIndexChange
            )
            .subscribe((e) => {
                this.changeDetectRef.detectChanges();
            })

            // Rx.Observable.merge(
            //     this._linkDragEnd,
            //     this._linkDrag
            // )
            // .subscribe(() => {
            //     this.changeDetectRef.detectChanges();
            // })
        ];
    }

    ngAfterViewInit() {
        this.viewInited = true;
        this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        setTimeout(() => {
            this.setText();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.viewInited) return;
        this.editingIndex = -2;
        this.changeDetectRef.detectChanges();
        this.setText();
    }

    setActive(event: MouseEvent, i: number = -1) {
        if (!this.selected) return;
        if (this.editingIndex != i) {
            this._stopEdit.next();
            this._startEdit.next(i);
        }
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
        this.setItemResize();
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
        this.setItemResize();
    }

    setItemResize() {
        let parent_width = this.parent.offsetWidth;
        let max_width = (this._choiceLabel.nativeElement as HTMLElement).offsetWidth + this.choice_extra_width;
        let textLabelElems = this._textLabels.toArray();

        textLabelElems.forEach((ele,i) => {
            if (i==0) {
              this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
            } else if ((ele.nativeElement as HTMLElement).offsetWidth > this.max_textWidth) {
              this.max_textWidth = (ele.nativeElement as HTMLElement).offsetWidth;
            }
        });

        this.renderer.setElementStyle(this.optionContainer.nativeElement, 'width', this.max_textWidth + this.extra_width + this.text_marginTB + 'px');

        let ele_width = this.max_textWidth + this.text_marginTB + this.extra_width;

        if (ele_width > max_width) {
          max_width = ele_width;
        }

        let d = this.container_padding + max_width;
        this.renderer.setElementStyle(this.parent, 'width', d + 'px');
        this.item.content.box.right = this.item.content.box.left + d - 10;
        this.setHeight();
    }

    setHeight() {
        if (this.parent && this._multiChoiceContainer.nativeElement) {
            let height = (this._multiChoiceContainer.nativeElement as HTMLElement).offsetHeight;
            this.renderer.setElementStyle(this.parent, 'height', height + 'px');
            this.item.content.box.bottom = this.item.content.box.top + height;
            // this.item.content.box.bottom = this.item.content.box.top + height - 56;
        }
    }

    getHTML(text: string): SafeHtml {
      return (this.sanitizer.bypassSecurityTrustHtml(text));
    }

    onAdd(event: MouseEvent) {
        if (!this.editable) return;
        event.stopPropagation();
        this._stopEdit.next();
        let parent_height = this.parent.offsetHeight;
        this.info.values.push('<p><span style="font-size: 14px;">&nbsp;</span></p>');
        this.changeDetectRef.detectChanges();
        this._stopEdit.next();
    }

    onRemove(i: number, event: MouseEvent) {
        if (!this.editable) return;
        event.stopPropagation();
        this.info.values.splice(i, 1);
        this.changeDetectRef.detectChanges();
        this.setHeight();
    }

    isEmpty(i: number = -1) {
        if (!this.editable) return false;
        if (i == -1) {
            return (this.editingIndex != i && $(this.info.label).text().trim()=='') ? true : false;
        } else {
            return (this.editingIndex != i && $(this.info.values[i]).text().trim()=='') ? true : false;
        }
    }

    onContainerClick(event: MouseEvent) {
        // if (this.editing) {
        //     event.stopPropagation();
        // }
    }

    ngOnDestroy() {
        this.viewInited = false;
        this.subs.forEach(s => s.unsubscribe());
    }
}

