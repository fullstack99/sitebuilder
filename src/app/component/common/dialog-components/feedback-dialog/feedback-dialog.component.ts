import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, HostListener, Input
       } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { FeedbackInfo } from '@app-models/feedback-info';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { AlertService, FeedbackService } from '@app/services';

/** */
export function createFeedbackDialogWindow(
    windowService: WindowService,
    dialogId: string
): DialogWindow<FeedbackDialogComponent> {
    return windowService.create<FeedbackDialogComponent>(
        FeedbackDialogComponent,
        {
            width: 250,
            position: {
                left: 'calc(50% - 126px)',
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
        comp.dialogId = dialogId;
        comp.close.subscribe(() => window.close());
    });
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'feedback-dialog.component.html',
    styleUrls: ['feedback-dialog.component.css']
})
export class FeedbackDialogComponent implements OnInit, OnDestroy {
    @Input('dialogId') dialogId = '';
    @Output('close') close = new EventEmitter<any>();

    // ---------------------------------------------------------------
    public _loading: boolean = false;
    public _blur = new Rx.Subject<void>();

    // ---------------------------------------------------------------
    public _comment  = new FormControl('');
    public _response = new FormControl(false);
    // private _name             = new FormControl('');
    public _email    = new FormControl('', Validators.pattern('[\\w\\d-\\+]+@[\\w\\d-]+\\.[\\w\\d]+'))

    // ---------------------------------------------------------------
    private uploadingFeedback: Rx.Subscription;
    private _subs: Rx.Subscription[] = [];

    constructor(
        private _elementRef: ElementRef,
        private _changeDetector: ChangeDetectorRef,
        private _appService: AppService,
        private _feedbackService: FeedbackService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this._appService.getFeedback(this.dialogId).map(feedbackInfo => {
            this._comment.setValue(feedbackInfo.comments, { emitEvent: false });
            this._response.setValue(feedbackInfo.require_response, { emitEvent: false });
            this._email.setValue(feedbackInfo.email, { emitEvent: false });
        });

        this._subs = [
            Rx.Observable.merge(
                    this._comment.valueChanges,
                    this._response.valueChanges,
                    this._email.valueChanges,
                    this._blur)
                .subscribe(() => this._changeDetector.detectChanges())
        ];
    }

    @HostListener('click')
    @HostListener('keydown')
    onClick() {
        this._changeDetector.detectChanges();
    }

    onMouseDownDialog(event: MouseEvent) {

    }

    onClose(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        this.close.emit();
    }

    isSubmit() {
        if (this._response.value && this._email.value!='' && this._email.valid) {
            return false;
        }
        else if (!this._response.value && this._comment.value!='') {
            return false;
        }
        return true;
    }

    onSubmit(event: MouseEvent) {
        event.stopPropagation();

        let feedback = {
            name: '',
            code: this.dialogId,
            email: this._email.value,
            comments: this._comment.value,
            require_response: this._response.value
        };

        this.onLoading(true);
        this.uploadingFeedback = this._feedbackService.addFeedback(feedback).subscribe((result: any) => {
            if (result == true) {
                this._appService.updateFeedback(this.dialogId, feedback);
                this.alertService.playToast('Success', 'Your Feedback is saved successfully.',0);
            }
            else {
                this.alertService.playToast('Failed', 'Saving Feedback is failed.', 1);
            }
            this.onLoading(false);
            this.close.emit();
        });
    }

    onLoading(event: boolean) {
        let ele: HTMLElement | null;
        this._loading = event;
        this._changeDetector.detectChanges();
        ele = (this._elementRef.nativeElement as HTMLElement).parentElement;
        if (event) {
            if (ele)
                ele.style.setProperty('background', '#CCC');
        }
        else {
            if (ele)
                ele.style.setProperty('background', 'white');
        }
    }

    onCancelled() {
        if (!this.uploadingFeedback) return;
        this.uploadingFeedback.unsubscribe();
        this.onLoading(false);
    }

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }
}
