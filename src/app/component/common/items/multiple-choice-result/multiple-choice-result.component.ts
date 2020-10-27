import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
    OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewChildren, AfterViewInit, Renderer, HostBinding, QueryList, ChangeDetectionStrategy
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { MultipleChoiceInfo } from '@app-models/form-info';
import { Item, CommonItemContent } from '@app-models/item-info';

@Component({
    moduleId: module.id,
    selector: 'multiple-choice-result',
    templateUrl: './multiple-choice-result.component.html',
    styleUrls: ['./multiple-choice-result.component.css']
})

export class MultipleChoiceResultComponent implements OnInit, OnChanges ,AfterViewInit, OnDestroy {
    @Input('item') item : Item;
    @ViewChild('choiceLabel') _choiceLabel: ElementRef;
    
    public info: MultipleChoiceInfo = new MultipleChoiceInfo;
    public _selected: string;
    public _values: string[] = [];    

    constructor(
        public _elementRef: ElementRef,
        public _sanitizer: DomSanitizer
    ) {}
    
    ngOnInit() {
        this.info = (this.item.content as CommonItemContent<MultipleChoiceInfo>).info.value;
        this._selected = $(this.info).text();
        this.info.values.map(value=> {
            this._values.push($(value).text());
        });
    }

    ngAfterViewInit() {        
        if (this._choiceLabel) {            
            (this._choiceLabel.nativeElement as HTMLElement).style.width = this.info.labelBox.width() + 'px';
        }
        (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement.style.zIndex = '2';
    }

    ngOnChanges(changes: SimpleChanges) {        
    }
   
    getHTML(text: string): SafeHtml {
		return (this._sanitizer.bypassSecurityTrustHtml(text));
	}
    
    ngOnDestroy() {
    }
}
