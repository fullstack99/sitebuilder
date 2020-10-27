import { Component, OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, Input, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	orderBy as _orderBy,
	without as _without,

} from 'lodash';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import * as omitDeep from '@app-lib/functions/omit-deep';
import { createNewEcommerceItemWindow } from '@app/component/ecommerce/items/new-item/new-item.component';
import { createNewSalesRangeWindow } from '@app/component/ecommerce/items/items-grid/sales-range/sales-range.component';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';

import { ImagePath, AttentionInfo } from '@app/models';
import { ProductItem } from '@app-models/ecommerce';
import { AppState } from '@app/stores/reducers';

import { ProductService } from '@app/services';
import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	selector: 'inventory-grid',
	templateUrl: './inventory-grid.component.html',
	styleUrls: [
	  '../items-grid/items-grid.component.css',
	  './inventory-grid.component.css'
	]
})

export class InventoryGridComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

	@Input('newItem') newItem: ProductItem;

	@ViewChild('tableHeader') tableHeader: ElementRef;
	@ViewChild('tableBody') tableBody: ElementRef;

	soldOut: FormControl = new FormControl('keep');
	soldOutOptionGroupView = false;

	public activeItem: ProductItem = null;
	public items: Array<ProductItem> = [];
	public viewItems: Array<ProductItem> = [];
	public productListings: Array<Array<any>> = [[], [], []];

	public _loading: boolean = false;
	public viewInited: boolean = false;

	public activeListingUid: string = null;
	public viewListings: boolean = false;
	public viewOptionDetails: string[] = [];
	public viewSales = false;

	public activeOrderKey = 0;
	private orderKeys = [
		{orderKey: 'title', order: true },
		{orderKey: 'price', order: false },
		{orderKey: 'priceComparison', order: false },
		{orderKey: 'onlineTime', order: false },
	];

	private openedEditItemDiag = false;
	private skip  = 0;
	private take  = 1000;
	private callingAPI: Subscription;
	private changedItem: ProductItem = null;
	private subs: Subscription[] = [];

	constructor(
		private appService: AppService,
		private windowService: WindowService,
		private productService: ProductService,
		private alertService: AlertService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		const listingUids = [];
		if (this.appService._currentPage) {
			const ecommItems = this.appService._currentPage.items.filter(i => i.itemType == 'EcommerceItem');
			for (let i = 0; i < ecommItems.length; i++) {
				const temp = _get(ecommItems[i], 'content.info.value.listingUids') || [];
				for (let j = 0; j < temp.length; j++) {
					if (temp[j])
						listingUids.push(temp[j]);
				}
			}
		}
		this.getItems(listingUids);
		this.getProductListings(listingUids);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
		if (changes['newItem'] && this.newItem) {
			this.setOrderKeys([this.newItem]);
			this.items.push(this.newItem);
			this.onSort(this.activeOrderKey, false);
		}
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	getItems(listingUids: string[] = []) {
		this.items = [];
		if (!this.appService._currentSite) return;
		this.refreshView(true);	
		this.callingAPI = this.productService.getProducts(this.skip, this.take, [_get(listingUids, [0])], true, true).subscribe(
			res => {
				this.setOrderKeys(res);
				this.items = res;
				this.onSort(this.activeOrderKey, false);
				this.refreshView();
			},
			error => {
				this.alertService.playToast('Oops', 'Server Error', 1);
				this.refreshView();
			},
			() => {
		});
	}

	getProductListings(listingUids: string[] = []) {
		let getProductListings: Promise<boolean>[] = [];
		for (let i = 0; i < 3; i++) {
			getProductListings.push(
				this.productService.getProductListing(i + 4).map(
					res => {
						let temp = res.filter(l=> l.parentUid == null && l.description != '');
						// temp = _orderBy(temp, 'description');
						res = _without(res, ...temp);

						for (let j = 0; j < temp.length; j++) {
							temp[j]['subListing'] = res.filter(l => l.parentUid == temp[j].uid && l.description != '' && (listingUids.length > 0 ? listingUids.findIndex(l.uid) >= 0 : true));
							// temp[j]['subListing'] = _orderBy(temp[j]['subListing'], ['description']);
							res = _without(res, ...temp[j]['subListing']);
						}
						this.productListings[i] = temp;
						return true;
					}
				)
				.catch((err, obs) => {
					return Observable.of(false);
				})
				.toPromise()
			);
		}

		Promise.all(getProductListings).then(() => {
		});
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	setOrderKeys(items: ProductItem[]) {
		items.forEach((item, index) => {
			this.getTotalAmount(item);
			this.getViewPrice(item);
		})
	}

	onSort(event: number, changeOrder: boolean = true) {
		
		this.activeOrderKey = event;
		this.viewListings = false;

		if (event >= 0) {
			this.activeListingUid = null;
		}

		if (changeOrder)
			this.orderKeys[event].order = !this.orderKeys[event].order;

		if (this.activeListingUid)
			this.viewItems = this.items.filter(i => i.listingUids.findIndex(luid => luid.uid == this.activeListingUid) >= 0);
		else
			this.viewItems = this.items;

		if (event >= 0 && this.orderKeys[event].orderKey == 'viewPrice') {
			let options = this.viewItems.filter(i => i['viewPrice'] === 'options');
			let prices = this.viewItems.filter(i => i['viewPrice'] !== 'options');

			if (this.activeListingUid) {
				// prices = _orderBy(prices, [price => price['listingUids'][price['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence, price => isNaN(price[this.orderKeys[event].orderKey]) ? price[this.orderKeys[event].orderKey].toLowerCase() : price[this.orderKeys[event].orderKey]], ['asc', this.orderKeys[event].order ? 'asc' : 'desc']);
				// options = _orderBy(options, [optionItem => optionItem['listingUids'][optionItem['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence], ['asc']);
				// this.viewItems = this.orderKeys[event].order ? prices.concat(options) : options.concat(prices);
				prices = _orderBy(prices, [price => price['listingUids'][price['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence], ['asc']);
				options = _orderBy(options, [optionItem => optionItem['listingUids'][optionItem['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence], ['asc']);
				this.viewItems = this.orderKeys[event].order ? prices.concat(options) : options.concat(prices);
			} else {
				prices = _orderBy(prices, [price => isNaN(price[this.orderKeys[event].orderKey]) ? price[this.orderKeys[event].orderKey].toLowerCase() : price[this.orderKeys[event].orderKey]], [this.orderKeys[event].order ? 'asc' : 'desc']);
				this.viewItems = this.orderKeys[event].order ? prices.concat(options) : options.concat(prices);
			}
		} else {
			if (this.activeListingUid) {
				// this.viewItems = _orderBy(this.viewItems, [viewItem => viewItem['listingUids'][viewItem['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence, viewItem => isNaN(viewItem[this.orderKeys[event].orderKey]) ? viewItem[this.orderKeys[event].orderKey].toLowerCase() : viewItem[this.orderKeys[event].orderKey]], ['asc', this.orderKeys[event].order ? 'asc' : 'desc']);
				this.viewItems = _orderBy(this.viewItems, [viewItem => viewItem['listingUids'][viewItem['listingUids'].findIndex(luid => luid.uid == this.activeListingUid)].sequence], ['asc']);
			} else {
				this.viewItems = _orderBy(this.viewItems, [viewItem => isNaN(viewItem[this.orderKeys[event].orderKey]) ? viewItem[this.orderKeys[event].orderKey].toLowerCase() : viewItem[this.orderKeys[event].orderKey]], [this.orderKeys[event].order ? 'asc' : 'desc']);
			}
		}
	}

	getTotalAmount(item: ProductItem) {
		let amount = 0;
		item.productInventories.forEach(pi => {
			if (pi.amount && !isNaN(pi.amount))
				amount += pi.amount;
		});
		item['totalAmount'] = amount;
	}

	getViewPrice(item: ProductItem) {
		item['viewPrice'] = item.productInventories.findIndex(pi => pi.price != item.price) < 0 ? item.price : 'options';
	}

	onClickedOutside(event) {
		this.viewOptionDetails = [];
		this.viewListings = false;
		this.soldOutOptionGroupView = false;

		if (this.openedEditItemDiag)
			return;
		this.activeItem = null;
	}

	isVisibleItemOption(uid) {
		return this.viewOptionDetails.indexOf(uid) >= 0
	}

	onActiveListing(e: MouseEvent, uid: string) {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		this.activeListingUid = uid;
		this.onSort(-1, false);
	}

	openItemOptions(event: MouseEvent, uid: string) {
		event.stopPropagation();
		event.preventDefault();
		this.viewListings = false;

		if (!uid) {
			if (this.viewOptionDetails.length != this.items.length)
				this.viewOptionDetails = this.items.map(i=>i.uid);
			else
				this.viewOptionDetails = [];
			return;
		}

		let index = this.viewOptionDetails.indexOf(uid);
		if (index < 0)
			this.viewOptionDetails.push(uid);
		else
			this.viewOptionDetails.splice(index, 1);
	}

	editItem(p: ProductItem) {
		let newItem = _cloneDeep(p);
		newItem = omitDeep.omitDeep(newItem, ['viewPrice', 'totalAmount']);
		this.openedEditItemDiag = true;
		this.activeItem = p;

		const newItemWindow = createNewEcommerceItemWindow(this.windowService, p.uid, newItem);
		newItemWindow.componentRef.instance.submit.subscribe(res => {
			newItemWindow.componentRef.destroy();
			this.openedEditItemDiag = false;

			let i = this.items.findIndex(item => item.uid == res.uid);

			if (i >= 0) {
				this.items[i] = res;
				this.getTotalAmount(this.items[i]);
				this.setOrderKeys([this.items[i]]);
				this.onSort(this.activeOrderKey, false);
			}
		});
		newItemWindow.componentRef.instance.close.subscribe(s => {
			newItemWindow.componentRef.destroy();
			this.openedEditItemDiag = false;
		});
		newItemWindow.open();
	}

	onFocusOut(event, item) {
		if (!this.changedItem)
			return;
		this.changedItem.productInventories.forEach(pi => {
			if (!pi.amount || pi.amount && isNaN(pi.amount)) {
				pi.amount = 0;
			}
		});
		this.getTotalAmount(this.changedItem);
		this.productService.updateProduct(this.changedItem).pipe().subscribe(
			res => {
				switch (event.type) {
					case HttpEventType.Sent:
						break;
					case HttpEventType.UploadProgress:
						break;
					case HttpEventType.Response:
						break;
				}
			},
			error=> {},
			() => {}
		);
		this.changedItem = null;
	}

	openSalesRange(event: MouseEvent): void {
		if (!event.isTrusted) {
			return;
		}
		this.viewSales = true;
		this.viewListings = false;

		let salesRangeWindow = createNewSalesRangeWindow(this.windowService);
		salesRangeWindow.kendoWindow.setOptions({
			position: { top: event.clientY, left: event.clientX }
		});

		salesRangeWindow.componentRef.instance.close.subscribe(() => {
			salesRangeWindow.destroy();	
			this.viewSales = false;
		});
		salesRangeWindow.open();
	}

	onSetActiveItem(e, i: number, isItem: boolean = false) {
		this.changedItem = this.viewItems[i];
		if (!isItem)
			return;
    }
    
    onChangeInventoryCount(e, i) {
        if (e && !isNaN(e)) {
			const num = parseFloat(e);
			this.viewItems[i].inventoryCount = num;
		} else {
			this.viewItems[i].inventoryCount = e;
		}
    }

	onChangeInventoryAmount(e, i, j) {
		if (e && !isNaN(e)) {
			const num = parseFloat(e);
			this.viewItems[i].productInventories[j].amount = num;
		} else {
			this.viewItems[i].productInventories[j].amount = e;
		}
		this.getTotalAmount(this.viewItems[i]);
	}

	onChangeOrderNum(event, i: number, isItem: boolean = false) {

	}

	backgroundImage(url: ImagePath): SafeStyle {
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url.location + '/' + encodeURIComponent(url.name)}')`) : '';
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s=>s.unsubscribe());
	}
}
