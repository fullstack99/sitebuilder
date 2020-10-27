import {
    Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { Validators, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { ShippingAddress } from '@app-models/ecommerce/shipping-address';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createShippingAddressWindow(
    windowService: WindowService,
    shippingAddress: ShippingAddress
): DialogWindow<ShippingAddressComponent> {
    return windowService.create<ShippingAddressComponent>(
        ShippingAddressComponent,
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
        comp.shippingAddress = shippingAddress;
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

@Component({
    moduleId: module.id,
    templateUrl: 'shipping-address.component.html',
    styleUrls: ['shipping-address.component.css']
})
export class ShippingAddressComponent implements OnInit, OnDestroy {
    @Input() shippingAddress: ShippingAddress;
    
    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<ShippingAddress>();
    
    initData: ShippingAddress;
    form: FormGroup;

    private subs: Rx.Subscription[] = [];

    constructor(
        private _fb: FormBuilder,
        private changeDetector: ChangeDetectorRef
    ) { 
        this.form = this._fb.group(new ShippingAddress());
    }

    ngOnInit() {
        this.initData = lodash.clone(this.shippingAddress);
        this.form.setValue(this.shippingAddress);
        this.subs = [
            this.form.valueChanges.subscribe(res => {
                this.changeDetector.detectChanges();
            })
        ]
    }    

    get isValid(): boolean {
        return this.form.valid && differenceDeep.isDifference(this.form.value, this.initData);
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
