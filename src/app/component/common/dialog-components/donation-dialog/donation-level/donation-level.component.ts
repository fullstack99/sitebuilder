import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, OnInit
    } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { FundraisingLevelInfo, Num_Levels } from '@app/models';

/**
 * Form type for `EventParticipantType`.
 */
export interface FundraisingLevelForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;        
        amount: FormControl;
        name: FormControl;
        isActive: FormControl;
    };    
}

export function newFundraisingLevelForm(v: FundraisingLevelInfo): FundraisingLevelForm {
    return <FundraisingLevelForm>new FormGroup({        
        amount: new FormControl(v.amount),
        name: new FormControl(v.name),
        isActive: new FormControl(v.isActive)
    });
}

@Component({
    moduleId: module.id,
    selector: 'donation-level',
    templateUrl: './donation-level.component.html',
    styleUrls: ['./donation-level.component.css' ],
    providers: []
})
export class DonationLevelComponent implements OnInit {
    @Input('form') form: FundraisingLevelForm;
    @Input('optionalFundraisingAmountEnabled') optionalFundraisingAmountEnabled = new FormControl(false);    
    @Input('num') num: number;
    @Input('last') last: boolean;

    ngOnInit() {
    }
    
    valueChange(event: any) {
        event.preventDefault();
        let value = event.target.value || '';
        
        this.form.controls.amount.setValue(value, {});       
    }
    eventHandler(event: KeyboardEvent) {        
        if (event.keyCode<46 || event.keyCode>57 || event.keyCode==47) {
            event.preventDefault();
            event.stopPropagation();
        }        
    }
}
