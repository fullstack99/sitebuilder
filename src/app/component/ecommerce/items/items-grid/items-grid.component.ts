import { Component, OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, Input, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';
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
import { SitemapService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'items-grid',
	templateUrl: './items-grid.component.html',
	styleUrls: ['./items-grid.component.css'],
})

export class ItemsGridComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

	@Input() newItem: ProductItem;

	@ViewChild('tableHeader') tableHeader: ElementRef;
	@ViewChild('tableBody') tableBody: ElementRef;

	public activeItem: ProductItem = null;
	public items: Array<ProductItem> = [];
	public viewItems: Array<ProductItem> = [];
	public productListings: Array<Array<any>> = [[], [], []];

	public _loading = false;
	public viewInited = false;

	public activeListingUid: string = null;
	public viewListings = false;
	public viewOptionDetails: string[] = [];
	public viewSales = false;

	public activeOrderKey = 0;
	private orderKeys = [
		{orderKey: 'title', order: true },
		{orderKey: 'viewPrice', order: false },
		{orderKey: 'priceComparison', order: false },
		{orderKey: 'onlineTime', order: false },
		{orderKey: 'pieces', order: false}
	];

	private openedEditItemDiag = false;
	private skip: number  = 0;
	private take: number  = 1000;
	private callingAPI: Subscription;
	private activePrice: number = -1;
	private changedItem: ProductItem = null;
  	private subs: Subscription[] = [];

	constructor(
		private store: Store<AppState>,
		private changeDetectorRef: ChangeDetectorRef,
		private sitemapService: SitemapService,
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
			this.getViewPrice(item);
			this.getPieces(item);
		});
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

	getViewPrice(item: ProductItem) {
		item['viewPrice'] = item.productInventories.findIndex(pi => pi.price != item.price) < 0 ? item.price : 'options';
	}

	getPieces(item: ProductItem) {
		let amount = 0;
		if (item.productInventories)
			item.productInventories.map(inventory=> {
				amount = amount + inventory.amount;
			});
		item['pieces'] = amount;
	}

	onClickedOutside(event) {
		this.viewOptionDetails = [];
		this.viewListings = false;

		if (this.openedEditItemDiag)
			return;
		this.activeItem = null;
	}

	isVisibleItemOption(uid) {
		return this.viewOptionDetails.indexOf(uid) >= 0;
	}

	onActiveListing(event: MouseEvent, uid: string) {
		event.stopPropagation();
		event.preventDefault();
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

	removeItem(uid: string, index: number) {
		let attentionWindow = createAttentionDialogWindow(
			this.windowService,
			new AttentionInfo(
				{ value: 'Delete Item', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: '', font_size: '16px', color: '#8c8c8c' }
				],
				true,
				['DELETE'],
				''
			));
		attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			attentionWindow.destroy();
			if (feedback) {
				this.productService.deleteProduct(uid).subscribe(res => {
					if (res) {
						this.items = this.items.filter(item=>item.uid != uid);
						this.viewItems = this.viewItems.filter(item=>item.uid != uid);
						this.changeDetectorRef.detectChanges();
					}
				});
			}
		});
		attentionWindow.componentRef.instance.close.subscribe(() => {
			attentionWindow.destroy();
		});
		attentionWindow.open();
	}

	editItem(p: ProductItem) {
		let newItem = _cloneDeep(p);
		newItem = omitDeep.omitDeep(newItem, ['viewPrice']);
		this.activeItem = p;
		this.openedEditItemDiag = true;

		const newItemWindow = createNewEcommerceItemWindow(this.windowService, p.uid, newItem);
		newItemWindow.componentRef.instance.submit.subscribe(res => {
			newItemWindow.componentRef.destroy();
			this.openedEditItemDiag = false;
			let i = this.items.findIndex(item => item.uid == res.uid);
			if (i >= 0) {
				this.items[i] = res;
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
		this.getViewPrice(this.changedItem);
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
		this.activePrice = -1;
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

	onActivePriceChange(event, i:number) {
		this.activePrice = this.viewItems[i].price;
		this.viewListings = false;
		this.onSort(this.activeOrderKey, false);
	}

	onPriceChange(event, i: number, isItem: boolean = false) {
		this.changedItem = this.viewItems[i];
		if (!isItem) return;
		let changed: boolean = false;
		this.changedItem.productInventories.forEach(pi=> {
			if (pi.price == this.activePrice) {
				pi.price = event;
				changed = true;
			}
		});
		this.activePrice = event;
		if (changed)
			this.getViewPrice(this.changedItem);
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
