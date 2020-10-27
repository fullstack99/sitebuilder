// import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
//     OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
//     ChangeDetectionStrategy, HostListener
// } from '@angular/core';
// import * as lodash from 'lodash';
// import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
// import { Maybe } from '@app-common/lib/maybe/maybe';
// import { Box } from '@app-common/lib/rect/rect';
// import { Item, CommonItemContent, SingleCheckBoxInfo } from '@app-models/index';

// @Component({
//     moduleId: module.id,
//     selector: 'single-check-item',
//     templateUrl: './single-check.component.html',
//     styleUrls: ['./single-check.component.css']    
// })
// export class SingleCheckComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input('item') item     : Item;
//     @Input('editable') editable = false;
//     @Input('editing' ) editing  = false;

//     @Output('itemChange') itemChange = new EventEmitter<Item>();
//     @Output('itemResize') itemResize = new EventEmitter<Box>();    
       
//     @ViewChild('singleTextLabel') singleTextLabel: ElementRef;    
//     @ViewChild('textEditorElem') textEditorElem: ElementRef;
//     @ViewChild('resultLabel') resultLabel: ElementRef;
    
//     padding_width = 48;

//     public info: SingleCheckBoxInfo = new SingleCheckBoxInfo;
//     public parent: HTMLElement;    
//     public _changes: boolean = false;    

//     constructor(
//         public _elementRef: ElementRef,
//         public _changeDetectRef: ChangeDetectorRef,
//         public _renderer: Renderer,
//         public _sanitizer: DomSanitizer
//     ) {}

//     ngAfterViewInit() {
//         if (this.textEditorElem) {
//             (this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
//         }
//         (this.resultLabel.nativeElement as HTMLElement).innerHTML = this.info.label;
//     }

//     ngOnInit() {
//         this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
//         this.info = lodash.cloneDeep((this.item.content as CommonItemContent<SingleCheckBoxInfo>).info.value);
//     }
//     ngOnChanges(changes: SimpleChanges) {        
//     }  

//     onEditorInput(text: string) {
//         console.log(text);
//         this.info.label = text;
//         this._changes = true;               
//         this.setItemResize();
//     }

//     onEditorDestroyed(text: string) {              
//     }    
    
//     setItemResize() {
//         let label_width = (this.singleTextLabel.nativeElement as HTMLElement).offsetWidth;        
//         let d = this.padding_width + label_width;
//         this.parent.style.width = d + 'px';        
//     }

//     emmitItemChange() {        
//         let content = this.item.content as CommonItemContent<SingleCheckBoxInfo>;
//         let item = this.item
//             .setContent(
//                 content.setInfo(
//                     Maybe.just(this.info)
//                 )            
//                 .setBox(content.box.setRight(content.box.left + this.parent.offsetWidth))
//         );        
//         this.itemChange.emit(item);
//     }

//     isEmpty() {              
//         return ($(this.info.label).text().trim() == '') ? true : false;
//     }
    
//     ngOnDestroy() {        
//     }

//     @HostListener('document:click', ['$event.target'])
//     public onClick(targetElement: any) {
//         const clickedInside = this._elementRef.nativeElement.contains(targetElement);
//         if (!clickedInside && this._changes && (event.target as HTMLElement).closest('.mce-container') == null) {            
//             this.emmitItemChange();
//         }
//     }    
// }

import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
    ChangeDetectionStrategy, HostListener
} from '@angular/core';
import * as lodash from 'lodash';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent, SingleCheckBoxInfo } from '@app/models';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
    moduleId: module.id,
    selector: 'single-check-item',
    templateUrl: './single-check.component.html',
    styleUrls: ['./single-check.component.css']    
})
export class SingleCheckComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input('item') item     : Item;
    @Input('editable') editable = false;
    @Input('editing' ) editing  = false;

    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();    
       
    @ViewChild('singleTextLabel') singleTextLabel: ElementRef;    
    @ViewChild('textEditorElem') textEditorElem: ElementRef;   
    
    private padding_width = 38;

    public info: SingleCheckBoxInfo = new SingleCheckBoxInfo;
    public parent: HTMLElement;
    public uid: string = '';

    constructor(
        private elementRef: ElementRef,
        private changeDetectRef: ChangeDetectorRef,
        private renderer: Renderer,
        private sanitizer: DomSanitizer
    ) {}

    ngAfterViewInit() {
        if (this.textEditorElem) {
            (this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.info.label;
        }
        this.setItemResize();
    }

    ngOnInit() {
        this.uid = this.item.uid != '' ? this.item.uid : UUID.UUID();
        this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this.info = (this.item.content as CommonItemContent<SingleCheckBoxInfo>).info.value;
    }
    ngOnChanges(changes: SimpleChanges) {
        this.item.uid
    }  

    onEditorInput(text: string) {        
        this.info.label = text;                    
        this.setItemResize();
    }

    setItemResize() {        
        let parent_width = this.parent.offsetWidth;
        let label_width = (this.singleTextLabel.nativeElement as HTMLElement).offsetWidth;        
        let label_height = (this.singleTextLabel.nativeElement as HTMLElement).offsetHeight;
        let d = this.padding_width + label_width;

        this.parent.style.width = d + 'px';
        this.item.content.box.right = this.item.content.box.left + d;
        this.item.content.box.bottom = this.item.content.box.top + label_height + 10;            
        this.parent.style.height = label_height + 10 + 'px';        
    }   

    isEmpty() {              
        return ($(this.info.label).text().trim() == '') ? true : false;
    }
    
    ngOnDestroy() {        
    }   
}

