import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ShippingAddress } from '@app/models/ecommerce';

@Component({
	selector: 'order-confirm',
	templateUrl: './order-confirm.component.html',
	styleUrls: ['./order-confirm.component.css']
})
export class OrderConfirmComponent implements OnInit {
	
	@Input() detail: any = null;
	@Input() optionValues: Array<string> = [];
	@Input() shippingAddress: ShippingAddress = new ShippingAddress();

	@Output() goHome = new EventEmitter<void>();

	constructor() { }

	ngOnInit() {
	}

	onSubmit() {
		this.goHome.emit();
	}
}
