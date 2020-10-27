import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as lodash from 'lodash';

import { createShippingAddressWindow } from './shipping-address/shipping-address.component';
import { createCreditCardsWindow } from './credit-cards/credit-cards.component';

import { ImagePath } from '@app/models';
import { CreditCards, ProductOptionValue, ShippingAddress, ProductItem } from '@app/models/ecommerce';

import { WindowService } from '@app-common/window/window.service';

@Component({
	selector: 'check-out',
	templateUrl: './check-out.component.html',
	styleUrls: ['./check-out.component.css']
})
export class CheckOutComponent implements OnInit {

	@Input() detail: any = null;
	@Input() qty: number = 1;
	@Input() optionValues: ProductOptionValue[] = [];

	@Output() back = new EventEmitter<void>();

	public shippingAddress: ShippingAddress = new ShippingAddress();
	public creditCards: CreditCards = new CreditCards();
	public _qty = new FormControl(1);
	public tempUrl: ImagePath = {location: "https://dev.glogood.com/product/03db57af-6fa1-4d9e-9b3e-44d5764e9b81", name: "toyota_hybrid_x_concept-wide.jpg"};
	public orderd: boolean = false;

	constructor(
		private windowService: WindowService,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit() {
		this._qty.setValue(this.qty);
	}

	isShippingAddress(): boolean {
		return lodash.isEqual(this.shippingAddress, new ShippingAddress());
	}

	isCreditCards(): boolean {
		return lodash.isEqual(this.creditCards, new CreditCards());
	}

	getPrice(item: ProductItem, qty: number = 1) {
        let unit = '$';
        if (!item.productInventories || item.productInventories.length == 0) return unit + (item.price * qty).toFixed(2);
        if (this.optionValues.length == item.productOptions.length && this.optionValues.findIndex(i=>!i) < 0) {
            let temp = item.productInventories.find(i=> {
                for (let j=0; j<this.optionValues.length; j++) {
                    if (i['optionValue' + (j+1)] != this.optionValues[j].name)
                        return false;
                }
                return true;
            });
            if (temp)
                return unit + (temp.price * qty).toFixed(2);
		}
		return unit + '0.00';
    }

	openShippingAddressDialog(): void {
		let shippingAddressDialog = createShippingAddressWindow(this.windowService, this.shippingAddress);
		shippingAddressDialog.componentRef.instance.submit.subscribe(s => {
			shippingAddressDialog.destroy();
			this.shippingAddress = s;
		});
		shippingAddressDialog.componentRef.instance.close.subscribe(s => {
			shippingAddressDialog.destroy();
		});
		shippingAddressDialog.open();
	}

	openCreditCardsDialog(): void {
		let creditCardsDialog = createCreditCardsWindow(this.windowService, this.creditCards);
		creditCardsDialog.componentRef.instance.submit.subscribe(s => {
			creditCardsDialog.destroy();
			this.creditCards = s;
		});
		creditCardsDialog.componentRef.instance.close.subscribe(s => {
			creditCardsDialog.destroy();
		});
		creditCardsDialog.open();
	}

	backgroundImage(url: ImagePath): SafeStyle {
		return url && url.name ? this.sanitizer.bypassSecurityTrustStyle(`url('${url.location + "/" + encodeURIComponent(url.name)}')`) : '';
	}

	goHome() {
		this.back.emit();
	}

	backPage() {
		this.back.emit();
	}

	onSubmit() {
		this.orderd = true;
	}
}
