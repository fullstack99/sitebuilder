import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy
       } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export class CommentInfo {
    static empty() {
        return new CommentInfo('','',false);
    }
    constructor(        
        public name: string,
        public comment: string,
        public disp: boolean
    ) { }
}
export function createCommentWindow(
    windowService: WindowService,
    form: CommentForm
): DialogWindow<CommentDialogComponent> {
    return windowService.create<CommentDialogComponent>(
        CommentDialogComponent,
        {
            width: 300,
            
            modal: true,
            draggable: false,
            resizable: true,
            scrollable: false,
            visible: false,
            title: false
        }
    )
    .changeInputs((dialogComponent, window) => {        
        dialogComponent.form = form;        
        dialogComponent.close.subscribe(() => {
            window.close();
        });
    });
}

export interface CommentForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;
        name: FormControl;
        comment: FormControl;
        disp: FormControl;
    };
}

export function newCommentForm(v: CommentInfo): CommentForm {
    return <CommentForm>new FormGroup({
        name: new FormControl(v.name),
        comment: new FormControl(v.comment),
        disp: new FormControl(v.disp)
    });
}

@Component({
    moduleId: module.id,
    selector: 'comment-dialog',
    templateUrl: 'comment-dialog.component.html',
    styleUrls: ['comment-dialog.component.css']
})
export class CommentDialogComponent implements OnInit {
    @Input('form') form: CommentForm;    
    @Output('close') close = new EventEmitter<void>();

    private _formChangesSub: Rx.Subscription;

    constructor(private _changeDetector: ChangeDetectorRef) { }
    ngOnInit() {
        this._formChangesSub = this.form.valueChanges.subscribe((x) => {
            this._changeDetector.detectChanges();
        });
    }

    openFeedbackDialog() {
        
    }
    
    onClose() {        
        this.close.emit(undefined);
    }
}
