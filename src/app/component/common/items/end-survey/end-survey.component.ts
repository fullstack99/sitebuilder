import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
    HostListener
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent } from '@app-models/item-info';
import { EndSurveyInfo } from '@app-models/survey-info';

@Component({
    moduleId: module.id,
    selector: 'end-survey-item',
    templateUrl: './end-survey.component.html',
    styleUrls: [
        './end-survey.component.css',
        '../item.component.css'
    ]
})
export class EndSurveyComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input('item'    ) item     : Item;
    @Input('editable') editable = false;
    @Input('editing' ) editing  = false;
    @Input('readOnly') readOnly = false;
    @Input('containerWidth') containerWidth: number = 1100;
    @Input('animation') animation: boolean = false;

    @Output('itemChange') itemChange = new EventEmitter<Item>();
    @Output('itemResize') itemResize = new EventEmitter<Box>();    
       
    @ViewChild('endTitle') endTitle: ElementRef;
    @ViewChild('singleTextLabel') singleTextLabel: ElementRef;       

    public info: EndSurveyInfo = new EndSurveyInfo();    
    public parent: HTMLElement;    
    public _box: Box;
    public _changes: boolean = false; 
    

    public _subs: Rx.Subscription[] = [];

    constructor(
        public _elementRef: ElementRef,
        public _changeDetectRef: ChangeDetectorRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}

    ngAfterViewInit() {
        setTimeout(() => {
            this.setItemResize();
            this._changes = false;
        },0);           
    }

    ngOnInit() {
        this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
        this.info = (this.item.content as CommonItemContent<EndSurveyInfo>).info.value;        
        this._subs=[            
        ];        
    }
    
    ngOnChanges(changes: SimpleChanges) {

    }   
        
    setItemResize() {
        this._changes=true;
        let label_width = (this.singleTextLabel.nativeElement as HTMLElement).offsetWidth + 20;
        let label_height = (this.singleTextLabel.nativeElement as HTMLElement).offsetHeight + 50;

        this.parent.style.width = label_width+ 'px';
        this.parent.style.height = label_height + 'px';
    }

    emmitItemChange() {        
        let content = this.item.content as CommonItemContent<EndSurveyInfo>;        
        let item = this.item
            .setContent(
                content.setInfo(
                    Maybe.just(this.info)
                )
                .setBox(
                    content.box
                        .setRight(content.box.left + this.parent.offsetWidth)
                        .setBottom(content.box.top + this.parent.offsetHeight)
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
