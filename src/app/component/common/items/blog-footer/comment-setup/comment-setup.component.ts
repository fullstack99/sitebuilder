import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
         ViewChild, ElementRef, HostListener, Input, OnChanges, SimpleChanges
       } from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { CommentSetup } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createCommentSetupWindow(
    windowService: WindowService,
    blogComment: CommentSetup = new CommentSetup
): DialogWindow<CommentSetupComponent> {
    return windowService.create<CommentSetupComponent>(
        CommentSetupComponent,
        {
            width: 300,
            position: {
                left: 'calc(50% - 150px)',
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
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'comment-setup.component.html',
    styleUrls: ['comment-setup.component.css']
})
export class CommentSetupComponent implements OnInit, OnDestroy {
    @Input('blogComment') blogComment : CommentSetup = new CommentSetup();

    @Output('close') close = new EventEmitter<void>();
    @Output('submit') submit = new EventEmitter<CommentSetup>();

    // ---------------------------------------------------------------
    public _allowComment = new FormControl(false);
    public _review = new FormControl(false);
    public _emailAlert = new FormControl(false);    
    public _email = new FormControl('', [Validators.pattern('[\\w\\d-\\+]+@[\\w\\d-]+\\.[\\w\\d]+'), Validators.required]);    
    // ---------------------------------------------------------------
    private _subs: Rx.Subscription[] = [];

    constructor(
        private _changeDetector: ChangeDetectorRef,
        private windowService: WindowService

    ) {}

    ngOnInit() {
        this._allowComment.setValue(this.blogComment.allowComment);
        this._review.setValue(this.blogComment.review);
        this._emailAlert.setValue(this.blogComment.emailAlert);
        this._email.setValue(this.blogComment.email);

        this._subs = [
            Rx.Observable.merge(
                this._allowComment.valueChanges,
                this._review.valueChanges,
                this._emailAlert.valueChanges,
                this._email.valueChanges
            )
            .subscribe(() => {
                this._changeDetector.detectChanges();
            })
        ];
    }    

    onClose() {
        this.close.emit();
    }

    onSubmit() {
        this.submit.emit(
            new CommentSetup(
                this._allowComment.value,
                this._review.value,
                this._emailAlert.value                
            ));
    }

    openFeedbackDialog(): void {
        createFeedbackDialogWindow(this.windowService, 'bl.c.110').open();
    }

    isValid() {
        if (this._emailAlert.value && this._email.invalid)
            return false;
        return true;
    }

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }
}
