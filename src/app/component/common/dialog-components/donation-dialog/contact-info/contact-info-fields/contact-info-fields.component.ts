import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ElementRef,
         ChangeDetectorRef
       } from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { ContactInfoForm, ContactFieldInfoForm, SecondFieldInfoForm } from '@app-dialogs/donation-dialog/contact-info/contact-info.form';
import { ContactInfo, ContactFieldInfo, SecondFieldInfo } from '@app/models';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
 
@Component({
    moduleId: module.id,
    templateUrl: './contact-info-fields.component.html',
    styleUrls: ['./contact-info-fields.component.css',
    ]
})
export class ContactInfoFieldsComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input('form') form: ContactInfoForm;
    @Output('close') close = new EventEmitter<void>();
    
    secondaryForm: SecondFieldInfoForm;
    
    private _formChangesSub: Rx.Subscription;    

    constructor(
        private _changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
        private _windowService: WindowService
    ) { }

    ngOnInit() {              
        this._formChangesSub = this.form.valueChanges.subscribe((x) => {
            this._changeDetector.detectChanges();
        });
    }

    ngAfterViewInit() {
        (this.elementRef.nativeElement as HTMLElement).parentElement.style.top = '50px';
    }

    onClose() {
        this.close.emit(undefined);
    }

    openFeedbackDialog() {        
        let window = createFeedbackDialogWindow(this._windowService, "f.cos.100");        
        window.open();
    }

    addField() {        
        this.form.controls.customFields.push(
            new ContactFieldInfoForm(new ContactFieldInfo())
        );
    }

    ngOnDestroy() {
        this._formChangesSub.unsubscribe();
    }
}
