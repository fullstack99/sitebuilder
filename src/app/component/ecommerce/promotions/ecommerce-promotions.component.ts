import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, Input, ViewChild, ChangeDetectorRef, ElementRef, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import * as lodash from "lodash";
import * as Rx from 'rxjs/Rx';

import { createPromotionDialogWindow } from '@app-dialogs/ecomm-promotion-dialog/ecomm-promotion-dialog.component';

import { Promotion } from '@app-models/ecommerce';

import { ProductService } from '@app/services/product.service';
import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService } from "@app-common/window/window.service";

@Component({
	moduleId: module.id,
	selector: 'ecommerce-promotions',
	templateUrl: './ecommerce-promotions.component.html',
	styleUrls: [
		'../../../../assets/styles/canvas-nav.css',
		'./ecommerce-promotions.component.css'
	],
})

export class EcommercePromotionsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

	@ViewChild('tableHeader') tableHeader: ElementRef;
	@ViewChild('tableBody') tableBody: ElementRef;
	
	public items: Array<Promotion> = [];	

	public _loading: boolean = false;
	public viewInited: boolean = false;	

	public activeOrderKey = 0;
	private orderKeys = [
		{orderKey: 'code', order: false },
		{orderKey: 'name', order: true },
		{orderKey: 'startDate', order: false },
		{orderKey: 'endDate', order: false },
		{orderKey: 'discountType', order: false },
		{orderKey: 'amount', order: false },
		{orderKey: 'requireCodeEntry', order: false }		
	];

	public isSaving: boolean = false;

	private skip: number  = 0;
	private take: number  = 100;
	private callingAPI: Rx.Subscription;
  	private subs: Rx.Subscription[] = [];

	constructor(		
		private location: Location,
		private changeDetectorRef: ChangeDetectorRef,
		private appService: AppService,
		private windowService: WindowService,
		private productService: ProductService,
		private alertService: AlertService
	) {}

	ngOnInit() {
		this.getItems();		
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;		
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	getItems() {
		this.items = [];
		if (!this.appService._currentSite) return;
		this.productService.getPromotions(0, 100).pipe().subscribe(
			res => {
				console.log(res);
				this.items = res;				
				this.onSort(this.activeOrderKey, false);
				this.refreshView();
			},
			error => {
				console.log(error);				
				this.alertService.playToast('Oops', 'Server Error', 1);
				this.refreshView();
			},
			() => {
		});
		this.refreshView(true);
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	onSort(event: number, changeOrder: boolean = true) {
		this.activeOrderKey = event;
		if (changeOrder)
			this.orderKeys[event].order = !this.orderKeys[event].order;		
		this.items = lodash.orderBy(this.items, [this.orderKeys[event].orderKey], [this.orderKeys[event].order ? 'asc' : 'desc']);
	}

	clickCanvasTool(tool: string) {
		if (tool == 'Back')		
			this.location.back();
        else if (tool == 'Save') {

		}
		else if (tool == 'Promotion') {
			this.editItem();	
		}            
	}

	editItem(item: Promotion = new Promotion, i: number = -1) {
		let promotionDiag = createPromotionDialogWindow(this.windowService, item);
		promotionDiag.componentRef.instance.submit.pipe().subscribe(res=> {
			if (i == -1)
				this.items.push(res);
			else
				this.items.splice(i, 1, res);
			this.onSort(this.activeOrderKey, false);
		})
		promotionDiag.open();
	}

	refreshView(loading: boolean = false) {		
		this._loading = loading;		
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s=>s.unsubscribe());
	}
}
