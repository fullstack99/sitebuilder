import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
         Renderer, OnChanges, SimpleChanges, ViewChild, ElementRef
       } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormGroup, AbstractControl, FormControl, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Skip } from '@app-models/survey-info';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createSkippingDialogWindow(
    windowService: WindowService
): DialogWindow<SkippingDialogComponent> {
    return windowService.create<SkippingDialogComponent>(
        SkippingDialogComponent,
        {
            width: 540,
            minHeight: 400,
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    )
    .changeInputs((comp, window) => {        
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'skipping-dialog.component.html',
    styleUrls: ['skipping-dialog.component.css']
})
export class SkippingDialogComponent implements OnInit, OnDestroy {    
    @Output('close') close = new EventEmitter<void>();
    @Output('submit') submit = new EventEmitter<Skip>();

    public _question = new FormControl(0);
    public _end = new FormControl(0);
    public _branch = new FormControl('');   

    public _subs: Rx.Subscription[];  

    // ---------------------------------------------------------------
    constructor(
        public _changeDetector: ChangeDetectorRef,
        public _windowService: WindowService,
        public _sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this._subs = [
        ];
    }

    onClose() {
        this.close.emit();
    }

    onSubmit() {
        let skip: Skip;

        switch(this._branch.value) {
            case 'current':
                skip = {branch: 'current', question: this._question.value};
                break;
            case 'end':
                skip = {branch: 'end', question: this._end.value};
                break;
            default:
                skip = {branch: this._branch.value, question: 0};
        }

        this.submit.emit(skip);
    }

    openFeedbackDialog() {        
    }

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());       
    }
}
