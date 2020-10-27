import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
         ViewChild, ElementRef,Input, Renderer
       } from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createMergeListWindow(
    windowService: WindowService,
    list: Array<string>
): DialogWindow<MergeListComponent> {
    return windowService.create<MergeListComponent>(
        MergeListComponent,
        {
            width: 400,
            position: {
                left: 'calc(50% - 200px)',
                top: 'calc(50% - 163px)'
            },
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => {
        comp.list = list;
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

export interface MergeListValue {
    fromLists: Array<string>;
    toList: string;
    isNew: boolean;
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'merge-list.component.html',
    styleUrls: ['merge-list.component.css']
})
export class MergeListComponent implements OnInit, OnDestroy {

    @Input('list') list: Array<string> = [];

    @Output('close') close = new EventEmitter<void>();
    @Output('submit') submit = new EventEmitter<MergeListValue>();    

    @ViewChild('button') button: ElementRef;

    private fromLists: Array<string> = [];
    newLists: Array<string> = [''];
    
    toList = new FormControl(-1);

    private subs: Rx.Subscription[] = [];

    constructor(
        private changeDetector: ChangeDetectorRef,
        private renderer: Renderer,
        private windowService: WindowService,
    ) {}

    ngOnInit() {
        this.subs = [
            this.toList.valueChanges.subscribe(() => {
                this.changeDetector.detectChanges();
                this.isValid();
            })
        ];
        this.isValid();
    }

    isValid() {
        let buttonEle = this.button.nativeElement as HTMLInputElement;        
        if (this.fromLists.length == 0 || this.toList.value == -1) {
            this.renderer.setElementAttribute(buttonEle, 'disabled', 'true');            
        }
        else if (this.toList.value > this.list.length - 1 && this.newLists[this.toList.value - this.list.length].trim() == '') {
            this.renderer.setElementAttribute(buttonEle, 'disabled', 'true');            
        }
        else {            
            buttonEle.removeAttribute('disabled');            
        }            
    }

    onCheck(event: any, item: string) {
        let index = this.fromLists.indexOf(item);
        if (event.srcElement['checked'] == true) {
            if (index < 0)
                this.fromLists.push(item);
        }            
        else {
            this.fromLists.splice(index, 1);
        }
        this.changeDetector.detectChanges();
        this.isValid();
    }    

    onMore() {
        this.changeDetector.detectChanges();
        this.newLists.push('');        
        this.changeDetector.detectChanges();        
    }

    onRemove() {        
        this.changeDetector.detectChanges();
    }    

    openFeedbackDialog() {
        let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
        feedbackWindow = createFeedbackDialogWindow(this.windowService, '');
        feedbackWindow.open();		
    }

    onSubmit() {
        let toList = this.toList.value < this.list.length ? this.list[this.toList.value] : this.newLists[this.toList.value - this.list.length];        
        this.submit.emit({ fromLists: this.fromLists, toList: toList, isNew: this.toList.value > this.list.length -1 });
    }    

    onClose() {
        this.close.emit();
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}
