import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges } from "@angular/core";
import { SafeStyle, DomSanitizer } from "@angular/platform-browser";
import * as lodash from "lodash";
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	selector: "ecommerce-orders",
	templateUrl: "./ecommerce-orders.component.html",
	styleUrls: ["./ecommerce-orders.component.css"]
})
export class EcommerceOrdersComponent implements OnInit, OnChanges, AfterViewInit {	
	
	private viewInited: boolean = false;

	constructor(
		private appService: AppService
	) { }

	ngOnInit(): void {		
		
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
        
	}

	goMyAccount() {
		this.appService.dispMyAccount.next(null);
	}
	
	goOrders() {
		this.appService.dispMyAccount.next('Orders');
	}

	ngAfterViewInit() {
		this.viewInited = true;	
	}
	
	refreshView(changed: boolean = false) {	
	}	
}

