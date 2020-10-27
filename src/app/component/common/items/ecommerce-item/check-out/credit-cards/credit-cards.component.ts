import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { Validators, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { CreditCards } from '@app-models/ecommerce/credit-cards';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createCreditCardsWindow(
    windowService: WindowService,
    creditCards: CreditCards
): DialogWindow<CreditCardsComponent> {
    return windowService.create<CreditCardsComponent>(
        CreditCardsComponent,
        {
            width: 350,
            position: {
                left: 'calc(50% - 175px)',
                top: 'calc(10%)'
            },
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => {
        comp.creditCards = creditCards;
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

@Component({
    moduleId: module.id,
    templateUrl: 'credit-cards.component.html',
    styleUrls: ['credit-cards.component.css']
})
export class CreditCardsComponent implements OnInit, OnDestroy {
    @Input() creditCards: CreditCards;

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<CreditCards>();
    
    initData: CreditCards;
    form: FormGroup;
    month_names_short: Array<string> = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    private subs: Rx.Subscription[] = [];

    constructor(
        private _fb: FormBuilder,
        private changeDetector: ChangeDetectorRef
    ) { 
        this.form = this._fb.group(new CreditCards());
    }

    ngOnInit() {
        this.initData = lodash.clone(this.creditCards);
        this.form.setValue(this.creditCards);
                
        this.subs = [
            this.form.valueChanges.subscribe((e) => {
                this.changeDetector.detectChanges();
            })
        ];        
    }   

    get isValid(): boolean {
        return this.form.valid && differenceDeep.isDifference(this.form.value, this.initData);
    }

    selectMonth(event) {
        this.form.controls['expirationDateMonth'].setValue(event);
    }

    onClose() {
        this.close.emit();
    }

    onSubmit() {
        this.submit.emit(this.form.value);
    }

    openFeedbackDialog() {
        
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}
