import {
    Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef, AfterViewInit, OnDestroy, Inject
       } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { RegularEventFee, EarlyBirdEventFee, EventFeeType } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

/**
 * Create new dialog window with `EventFeeComponent` inside.
 * 
 * @param windowService WindowService instance.
 * @param form `EventFeeForm` to be bound to the component.
 */
export function createEventFeeWindow(
    windowService: WindowService,
    form: EventFeeForm
): DialogWindow<EventFeeComponent> {
    return windowService.create<EventFeeComponent>(
        EventFeeComponent,
        {
            width: 400,            
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    )
    .changeInputs((feeComponent, window) => {
        feeComponent.form = form;
        feeComponent.close.subscribe(() => {
            window.close();
        });
    });
}

/**
 * Form type for `EventFee`.
 */
export interface EventFeeForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;
        eventFeeType: FormControl;
        price: FormControl;
        earlyPrice: FormControl;
        earlyPriceEndDate: FormControl;
    };
}

/**
 * Create new `EventFeeForm` from `RegularEventFee` or `SpecialEventFee`.
 */
export function newEventFeeForm(value: RegularEventFee | EarlyBirdEventFee): EventFeeForm {
    const v = value as RegularEventFee & EarlyBirdEventFee;    
    return <EventFeeForm>new FormGroup({
        eventFeeType: new FormControl(value.eventFeeType),
        price: new FormControl(value.price, [<any>Validators.required]),
        earlyPrice: new FormControl(v.earlyPrice, [<any>Validators.required]),
        earlyPriceEndDate: new FormControl(v.earlyPriceEndDate || new Date())       
    });
}

@Component({
    selector: 'event-fee-early-bird',
    templateUrl: './event-fee-early-bird.component.html',
    styleUrls: ['./event-fee-early-bird.component.css']
})
export class EventFeeComponent implements OnInit, OnDestroy {
    @Input('form') form: EventFeeForm;
    @Output('close') close = new EventEmitter<void>();

    private _formChangesSub: Rx.Subscription;    
    feeform: FormGroup;

    constructor(private _changeDetector: ChangeDetectorRef, private _windowService: WindowService, @Inject(FormBuilder) fb: FormBuilder) {
        this.feeform = fb.group({
            price: ['', [<any>Validators.required]],
            earlyPrice: ['', [<any>Validators.required]],
            earlyPriceEndDate: [new Date()]
        });
    }

    ngOnInit() {
        this._formChangesSub = this.form.valueChanges.subscribe((x) => {
            this.feeform.controls["price"].setValue(this.form.value.price, {});
        });
        this.feeform.controls["price"].setValue(this.form.value.price, {});
        this.feeform.controls["earlyPrice"].setValue(this.form.value.earlyPrice, {});
        this.feeform.controls["earlyPriceEndDate"].setValue(this.form.value.earlyPriceEndDate, {});        
        this._formChangesSub = this.feeform.valueChanges.subscribe((x) => {
            this._changeDetector.detectChanges();
        });
    }
    
    onClose() {
        this.close.emit();
    }

    onSave() {        
        this.form.controls.price.setValue(
            this.feeform.value.price,
            { onlySelf: true, emitEvent: false, emitModelToViewChange: true }
        );        
        this.form.controls.earlyPriceEndDate.setValue(this.feeform.value.earlyPriceEndDate, {});
        this.form.controls.earlyPrice.setValue(this.feeform.value.earlyPrice, {});
        this.form.controls.eventFeeType.setValue('EarlyBirdEventFee', {});
        this.onClose();
    }

    ngOnDestroy() {
        this._formChangesSub.unsubscribe();
    }

    openFeedbackDialog() {
        let window = createFeedbackDialogWindow(this._windowService, 'e.ebp.101');
        window.open();
    }
}
