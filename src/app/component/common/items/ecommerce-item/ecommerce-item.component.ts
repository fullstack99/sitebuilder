import {
	Component,
	Input,
	Output,
	SimpleChanges,
	HostBinding,
	ViewEncapsulation,
	ElementRef,
	Renderer,
	ChangeDetectorRef,
	OnChanges,
	OnInit,
	AfterViewInit,
	OnDestroy,
	ViewChild,
	EventEmitter,
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
	DomSanitizer,
	SafeStyle,
	SafeResourceUrl
} from '@angular/platform-browser';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	orderBy as _orderBy,
	range as _range,
	without as _without,

} from 'lodash';
import { Observable, Subject, Subscription } from 'rxjs';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import * as imageUrl from '@app-lib/functions/image-url';

import { createNewEcommerceItemWindow } from '@app/component/ecommerce/items/new-item/new-item.component';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createEcommChooseItemDialogWindow } from '@app-dialogs/ecomm-choose-item-dialog/ecomm-choose-item-dialog.component';
import { createEcommChooseExistingItemWindow } from '@app-dialogs/ecomm-choose-item-dialog/choose-existing-item.component';

import {
	AttentionInfo,
	ImagePath,
	Item,
	CommonItemContent,
	EcommerceInfo,
	Listing
} from '@app/models';
import {
	ProductItem,
	ProductOption,
	ProductOptionValue
} from '@app/models/ecommerce/items';

import { ProductService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	selector: 'ecommerce-item',
	templateUrl: './ecommerce-item.component.html',
	styleUrls: ['./ecommerce-item.component.css']
})
export class EcommerceItemComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
	@Input() item: Item;
	@Input() editable = false;
	@Input() selected = false;
	@Input() parent = '';
	@Input() containerWidth = 1100;
	@Input() loading = false;

	@Output() itemChange = new EventEmitter<Item>();
	@Output() itemResize = new EventEmitter<Box>();
	@Output() undo = new EventEmitter<void>();
	@Output() scrollTop = new EventEmitter<void>();
	@Output() canvasTool = new EventEmitter<string>();

	@ViewChild('reviewContainer') reviewContainer: ElementRef;
	@ViewChild('gridContainer') gridContainer: ElementRef;
	@ViewChild('productsContainer') productsContainer: ElementRef;
	@ViewChild('itemDetailContent') itemDetailContent: ElementRef;
	@ViewChild('detailViewContainer') detailViewContainer: ElementRef;
	

	public itemContent: CommonItemContent<EcommerceInfo>;
	public info: EcommerceInfo = new EcommerceInfo();

	public viewItems: ProductItem[] = [];
	public itemsPerPage: number = 8;

	public _loading: boolean = false;
	public imageIndex: number = 0;
	public selectedOptionValues: ProductOptionValue[] = []; // for detail view of item

	public checkOut: boolean = false;

	public navIns: any = {
		departments: [`Women's`, `Men's`, `Outdoors`, `Accessories`],
		collections: ['On Sale', 'New Arrivals', 'Summer Items'],
		brands: ['Stanely', 'Martha Stewart', 'Cannon']
	};

	public qty = new FormControl(1);
	showValue = (c: ProductOption) => (c ? c.name : '');

	public isMore = false;
	public stopScrolling = false;
	public productsContainerScroll = new Subject<void>();

	private viewInited: boolean = false;
	private subs: Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer,
		private router: Router,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private productService: ProductService,
		private appService: AppService,
	) {}

	ngOnInit() {
		this.itemContent = this.item.content as CommonItemContent<EcommerceInfo>;
		this.info = _cloneDeep(this.itemContent.info.value);

		if (!this.info.page) this.info.page = 1;
		if (this.info.showNavigation == undefined)
			this.info.showNavigation = true;

		if ((this.info.isAllProducts || this.info.showNavigation) && this.info.layoutType < 3) {
			if (!this.info.products)
				this.info.products = [];
			if (!this.info.listings) {
				this.getProductListings();
			} else if (
				_get(this.info, ['products', 'length']) > 0 &&
				this.info.products[0].listingUids.indexOf(this.info.activeListingUid) >= 0
			) {
				this.refreshView(false, 1);
			} else {
				this.getActiveListingProducts(0, 12, true);
			}
		} else {
			if (this.info.activeListingUid) {
				this.getActiveListingProducts(0, 12, false);
			} else {
				if (this.info.productUids && this.info.productUids.filter(i => !!i).length > 0) {
					this.getItemProducts();
				} else if (this.info.listingUids[0] || this.info.listingUids[1] || this.info.listingUids[2]) {
					this.getProductListings();
				} else {
					this.getItemProducts();
				}
			}
			// if (
			// 	!this.info.isAllProducts &&
			// 	_get(this.info, ['products', 'length']) != _get(this.info, ['productUids', 'length'])
			// ) {
			// 	this.getItemProducts();
			// } else if(this.info.activeListingUid) {
			// 	this.getActiveListingProducts(0, 12, true);
			// 	// this.refreshView();
			// }
		}

		this.subs = [
			this.productsContainerScroll.subscribe(() => {
				if (this.stopScrolling || (!this.info.showNavigation && !this.info.isAllProducts))
					return;
				const el = this.productsContainer.nativeElement as HTMLElement;
				if (el.scrollHeight - el.offsetHeight - el.scrollTop === 0) {
					this.getActiveListingProducts(this.viewItems.length, 12, !this.info.showNavigation);
				}
			}),
		];
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited)
			return;
		if (changes['loading']) {
			this.onPageChange(1);
		}
	}

	ngAfterViewInit() {
		this.setElementStyle();
		this.viewInited = true;
	}

	getProductListings() {
		const getProductListings: Promise<boolean>[] = [];
		if (!this.info.listings || this.info.listings.length < 3)
			this.info.listings = [[], [], []];
		for (let i = 0; i < 3; i++) {
			getProductListings.push(
				this.productService
					.getProductListing(i + 4)
					.map(res => {
						const temp = res.filter(l => l.parentUid == null && l.description != '' && (this.info.listingUids[i] ? this.info.listingUids[i].indexOf(l.uid) >= 0 : true));
						// temp = _orderBy(temp, 'description');
						res = _without(res, ...temp);

						for (let j = 0; j < temp.length; j++) {
							temp[j]['subListing'] = res.filter(
								l => l.parentUid == temp[j].uid && l.description != ''
							);
							// temp[j]['subListing'] = _orderBy(temp[j]['subListing'], [
							// 	'description'
							// ]);
							if (!this.info.activeListingUid) {
								if (!temp[j].isTitle) {
									this.info.activeListingUid = temp[j].uid;
								} else {
									let k = 0;
									while (k < temp[j]['subListing'].length && !this.info.activeListingUid) {
										if (!temp[j]['subListing'][k].isTitle)
											this.info.activeListingUid = temp[j]['subListing'][k].uid;
										k++;
									}
								}
							}
							res = _without(res, ...temp[j]['subListing']);
						}

						this.info.listings[i] = temp;
						return true;
					})
					.catch((err, obs) => {
						console.log(i, err);
						return Observable.of(false);
					})
					.toPromise()
			);
		}

		Promise.all(getProductListings).then(() => {
			this.getActiveListingProducts();
		});
	}

	getActiveListingProducts(skip: number = 0, take: number = 12, allItems = false) {
		if (skip == 0)
			this.stopScrolling = false;

		this._loading = true;

		if (!this.info.products)
			this.info.products = [];

		if (!allItems && !this.info.activeListingUid) {
			this.appendEmptyProducts(null, 8);
		} else {
			this.productService
				.getProducts(skip, take, (allItems ? [] : [this.info.activeListingUid]), true, true)
				.subscribe(
					res => {
						if (skip == 0) {
							this.info.products = [];
						}
						this.info.products.push(..._orderBy(res, ['listingUids[0].sequence']));

						if (res.length == 0) {
							this.stopScrolling = true;

							if (skip == 0) {
								this.appendEmptyProducts(null, 8);
							} else {
								this.isMore = true;
							}
						}

						setTimeout(() => {
							if (this.info.layoutType == 3) {
								this.setElementStyle();
							} else {
								this.refreshView(
									false,
									1
									// allItems && this.info.showNavigation == false ? 1 : this.info.layoutType == 3 ? 2 : 1
								);
							}
						});
					},
					error => {
						this.refreshView();
					},
					() => {}
				);
		}
	}

	getItemProducts() {
		const getProducts: Promise<boolean>[] = [];
		this._loading = true;
		this.info.products = [];
		if (this.info.productUids.length < this.info.initViewNum) {
			this.info.productUids.push(
				..._range(0, this.info.initViewNum - this.info.productUids.length)
					.map(() => '')
			);
		}

		for (let i = 0; i < this.info.productUids.length; i++) {
			if (
				this.info.productUids[i] != '' &&
				!this.info.products.find(p => p.uid == this.info.productUids[i])
			) {
				getProducts.push(
					this.productService
						.getProduct(this.info.productUids[i], true)
						.map(res => {
							this.info.products[i] = res;
							return true;
						})
						.catch((err, obs) => {
							return Observable.of(false);
						})
						.toPromise()
				);
			} else if (this.info.productUids[i] == '') {
				this.info.products[i] = new ProductItem();
				getProducts.push(Observable.of(false).toPromise());
			} else {
				const temp = this.info.products.find(
					p => p.uid == this.info.productUids[i]
				);
				this.info.products[i] = temp;
			}
		}

		Promise.all(getProducts).then(() => {
			if (this.parent == 'preview') {
			}

			this.isMore = this.info.products && this.info.products.length <= this.itemsPerPage * this.info.page;

			this.refreshView();

			setTimeout(() => {
				if (this.info.layoutType == 3) {
					this.setElementStyle();
				} else {
					this.setItemBox();
				}
			});
		});
	}

	setElementStyle() {
		const layoutType = '' + this.info.layoutType;
		const ele = this.elementRef.nativeElement as HTMLElement;
		const reviewContainer = this.reviewContainer
			? (this.reviewContainer.nativeElement as HTMLElement)
			: null;

		if (layoutType == '3') {
			ele.style.height = '100%';
			if (reviewContainer) reviewContainer.style.height = '100%';
		} else {
			ele.style.height = 'auto';
			if (reviewContainer) reviewContainer.style.height = 'auto';
		}
	}

	setItemBox() {
		const width = Math.min(this.containerWidth, 1040);
		const left = Math.max((this.containerWidth - width) / 2, 0);
		const temp = this.itemContent.setInfo(Maybe.just(this.info));
		if (
			temp.box.width() != width ||
			temp.box.height() !=
				(this.elementRef.nativeElement as HTMLElement).offsetHeight
		) {
			this.itemResize.emit(
				new Box(
					left,
					left + width,
					temp.box.top,
					temp.box.top +
						(this.elementRef.nativeElement as HTMLElement).offsetHeight
				)
			);
		}
	}

	get isNav(): boolean {
		if (
			!this.info.listings ||
			(this.info.listings[0].length == 0 &&
				this.info.listings[1].length == 0 &&
				this.info.listings[2].length == 0)
		)
			return false;
		return true;
	}

	get itemClass(): string {
		return this.info.layoutType == 1 ? 'item-row' : 'col-xs-6 col-sm-3';
	}

	getPrice(item: ProductItem) {
		const unit = '$';

		if (!item.productInventories || item.productInventories.length == 0)
			return `${unit}${(item.price || 0).toFixed(2)}`;
		if (
			this.selectedOptionValues.length == item.productOptions.length &&
			this.selectedOptionValues.findIndex(i => !i) < 0
		) {
			const temp = item.productInventories.find(i => {
				for (let j = 0; j < this.selectedOptionValues.length; j++) {
					if (i['optionValue' + (j + 1)] != this.selectedOptionValues[j].name)
						return false;
				}
				return true;
			});

			if (temp)
				return `${unit}${(temp.price || 0).toFixed(2)}`;
		}
		const prices = item.productInventories.map(pi => pi.price);
		const min = Math.min(...prices).toFixed(2);
		const max = Math.max(...prices).toFixed(2);
		if (min == max) return `${unit}${min}`;
		return `${unit}${min} ~ ${unit}${max}`;
	}

	changeSelected(event, index) {
		this.selectedOptionValues[index] = event;
	}

	isImage(image: ImagePath): boolean {
		return image && image.name != '' ? true : false;
	}

	getProducts(
		i: number = 0,
		skip: number = 0,
		take: number = 8,
		listingUid: string = ''
	) {
		this._loading = true;
		this.productService
			.getProducts(skip, take, [listingUid], true, true)
			.subscribe(
				res => {
					this.info.products = this.info.products.filter(
						(p, index) => index < i || p.uid != ''
					);
					this.info.products.splice(i, 0, ...res);
					this.appendEmptyProducts(
						null,
						this.info.initViewNum - this.info.productUids.length
					);
				},
				error => {
					this._loading = false;
				},
				() => {}
			);
	}

	// getProductProductListings(i: number, items: ProductItem[]) {
	//		 let getProductListings: Promise<boolean>[] = [];
	//		 for(let j=0; j<items.length; j++) {
	//				 if (!!items[j].uid) {
	//						 getProductListings.push(
	//								 this.productService.getProductProductLisitngs(items[j].uid).map(
	//										 res => {
	//												 items[j]['listings'] = res;
	//												 if (!this.info.listings) this.info.listings = [[],[],[]];
	//												 for(let i=0; i<3; i++) {
	//														 let temp = res.filter(l => l.type == i+4);
	//														 let temp1 = temp.filter(l=> l.parentUid == null);
	//														 res = _without(res, ...temp);
	//														 temp = _without(temp, ...temp1);

	//														 temp1 = temp1.filter(l=> this.info.listings[i].findIndex(li=>li.uid == l.uid) < 0);

	//														 for(let j=0; j<temp1.length; j++) {
	//																 temp1[j]['subListing'] = temp.filter(l => l.parentUid == temp1[j].uid);
	//																 temp1[j]['subListing'] = _orderBy(temp1[j]['subListing'], ['sequence']);
	//																 temp = _without(temp, ...temp1[j]['subListing']);
	//														 }

	//														 this.info.listings[i].push(...temp1);
	//														 this.info.listings[i] = _orderBy(this.info.listings[i], ['sequence']);

	//														 if (!this.info.activeListingUid && this.info.listings[i].length > 0)
	//																 this.info.activeListingUid = this.info.listings[i][0].uid;
	//												 }
	//												 return true;
	//										 }
	//								 )
	//								 .catch((err, obs) => {
	//										 return Observable.of(false);
	//								 })
	//								 .toPromise()
	//						 )
	//				 }
	//		 }

	//		 Promise.all(getProductListings).then(() => {
	//				 if (this.info.activeProduct) {
	//						 this.info.activeProduct = items[0];
	//				 }
	//				 if (i != null) {
	//						 this.info.products[i] = items[0];
	//				 }

	//				 for(let j=0; j<this.info.products.length; j++) {
	//						 if (this.info.products[j].uid == items[0].uid)
	//								 this.info.products[j] = items[0];
	//				 }
	//				 this.refreshView(false, true);
	//		 });
	// }

	onCancelled() {}

	appendEmptyProducts($event: MouseEvent, num: number) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (num > 0) {
			this.info.products.push(
				..._range(0, num).map(() => {
					let newItem = new ProductItem();
					if (!!this.info.activeListingUid)
						newItem.listingUids = [this.info.activeListingUid];
					return newItem;
				})
			);
			this.info.initViewNum = this.info.initViewNum + num;
		}
		this.refreshView(
			false,
			1
			// this.info.layoutType == 3 ? 2 : 1
		);
	}

	goBack(event: MouseEvent) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.info.viewDetail = false;
		(this.elementRef.nativeElement as HTMLElement).style.width = '100%';
		this.refreshView(
			false,
			this.info.showNavigation == false || this.info.layoutType == 3 ? 2 : 1,
			this.info.prevBox
		);
	}

	onClickItem(event: MouseEvent, i: number, item: ProductItem) {
		if (this.editable) return;
		this.onViewItemDetails(null, item);
	}

	onViewItemDetails(event: MouseEvent, item: ProductItem) {
		if (event) {
			event.stopPropagation();
		}
		if (item)
			this.info.activeProduct = item;

		this.info.viewDetail = true;
		this.info.prevBox = _cloneDeep(this.itemContent.box);
		this.selectedOptionValues = [];
		this.imageIndex = 0;
		const width = Math.min(this.containerWidth, 768);

		(this.elementRef.nativeElement as HTMLElement).style.width = width + 'px';

		setTimeout(() => {
			console.log((this.detailViewContainer.nativeElement).offsetHeight)
			const left = Math.max(this.containerWidth - 768, 0) / 2;
			this.itemResize.emit(
				new Box(
					left,
					left + width,
					this.itemContent.box.top,
					this.itemContent.box.top +
						(this.detailViewContainer.nativeElement as HTMLElement).offsetHeight
				)
			);
		});
	}

	onViewGrid() {
		this.checkOut = false;
		(this.elementRef.nativeElement as HTMLElement).style.width = '100%';
		this.refreshView(
			false,
			this.info.showNavigation == false ? 2 : 1,
			this.info.prevBox
		);
	}

	openItemSetup(
		event: MouseEvent,
		i: number,
		uid: string,
		productItem: ProductItem
	) {
		// i == null then activeProduct
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		const itemSetup = createNewEcommerceItemWindow(
			this.windowService,
			uid,
			productItem,
			this.info.activeListingUid,
			this.info.activeListingUid ? this.viewItems.length : null,
		);
		itemSetup.componentRef.instance.submit.subscribe(res => {
			itemSetup.componentRef.destroy();
			if (this.info.activeProduct) {
				this.info.activeProduct = res;
			}
			if (i != null) {
				this.info.products[i] = res;
			}

			for (let j = 0; j < this.info.products.length; j++) {
				if (this.info.products[j].uid == res.uid)
					this.info.products[j] = res;
			}
			this.refreshView(
				false,
				this.info.isAllProducts || this.info.showNavigation ? 0 : 2
			);
		});
		itemSetup.componentRef.instance.close.subscribe(s => {
			itemSetup.componentRef.destroy();
		});
		itemSetup.open();
	}

	openExistingItem(i: number, category: number) {
		let chooseExistingItem = createEcommChooseExistingItemWindow(
			this.windowService,
			category
		);
		chooseExistingItem.componentRef.instance.submit.subscribe(res => {
			chooseExistingItem.destroy();

			if (category == -1) {
				if (this.info.activeProduct) {
					this.info.activeProduct = res;
				}
				if (i != null) {
					this.info.products[i] = res;
				}

				for (let j = 0; j < this.info.products.length; j++) {
					if (this.info.products[j].uid == res.uid) this.info.products[j] = res;
				}
				this.info.listingUids = [null, null, null];
				this.info.listings = null;
				this.info.showNavigation = false;
				this.info.activeListingUid = null;
				this.refreshView(
					false,
					2
					// this.info.isAllProducts || this.info.showNavigation ? 0 : 2
					// this.info.showNavigation == false || this.info.layoutType == 3 ? 2 : 0
				);
			} else {
				this.info.listings = null;
				this.info.activeListingUid = '';
				this.info.listingUids[category - 4] = [res];
				this.info.products = [];
				this.info.productUids = [];
				this.refreshView(false, 2);
				// if (this.info.layoutType == 3) {
				// 	this.getProducts(i, 0, 1, res);
				// } else {
				// 	this.getProducts(i, 0, 12, res);
				// }
			}
		});
		chooseExistingItem.componentRef.instance.close.subscribe(s => {
			chooseExistingItem.destroy();
		});
		chooseExistingItem.open();
	}

	openCataloguePage(event: MouseEvent, item: ProductItem, isSingle: boolean) {
		event.stopPropagation();
		if (!item) return;
		let itemIndex = this.info.products.findIndex(p => p === item);
		let cataloguePageItems = createEcommChooseItemDialogWindow(
			this.windowService,
			item.uid == '',
			isSingle
		);
		cataloguePageItems.componentRef.instance.submit.subscribe(res => {
			cataloguePageItems.destroy();
			switch (res) {
				case 'new':
					this.openItemSetup(null, itemIndex, '', new ProductItem());
					break;
				case 'edit':
					this.openItemSetup(null, itemIndex, item.uid, item);
					break;
				case 'existItem':
					this.openExistingItem(itemIndex, -1);
					break;
				case 'allExistItem':
					if (this.info.layoutType == 3) this.getProducts(itemIndex, 0, 1, '');
					else this.getProducts(itemIndex, 0, 12, '');
					break;
				case 'byDepartment':
					this.openExistingItem(itemIndex, 4);
					break;
				case 'byCollections':
					this.openExistingItem(itemIndex, 5);
					break;
				case 'byVendor':
					this.openExistingItem(itemIndex, 6);
					break;
				default:
					break;
			}
		});
		cataloguePageItems.componentRef.instance.close.subscribe(s => {
			cataloguePageItems.destroy();
		});
		cataloguePageItems.open();
	}

	onActiveListing(listing: Listing, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (listing.isTitle)
			return;
		this.info.activeListingUid = listing.uid;
		this.getActiveListingProducts();
	}

	removeItem(event: MouseEvent, item: ProductItem) {
		event.stopPropagation();

		if ((this.info.isAllProducts || this.info.showNavigation) && this.info.layoutType < 3) {
			this.productService.deleteProductProductListing(item.uid, this.info.activeListingUid).subscribe(res => {
				this.info.activeProduct = new ProductItem();
				this.info.products = this.info.products.filter(p => p != item);
				this.refreshView(false, 0);
			});
		} else {
			this.info.activeProduct = new ProductItem();
			this.info.products = this.info.products.filter(p => p != item);
			if (this.info.products.length > 1) {
				if (this.info.products.length <= this.info.initViewNum)
					this.info.initViewNum--;
			} else {
				this.info.products[0] = new ProductItem();
			}
			this.refreshView(false, 2);
		}
	}

	onAddItem(event: MouseEvent) {
		event.stopPropagation();
		this.canvasTool.emit('EcommerceAddItem');
	}

	onPageChange(event) {
		this.info.page = event;
		this.scrollTop.emit();
		this.refreshView();
	}

	onViewAllItems(e) {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		this.info.page = 1;
		this.itemsPerPage = this.info.products.length;
		this.refreshView();
	}

	gotoNavigation(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.router.navigate(['/detail', 20, 5], {
			queryParams: { selectPage: 'Catalog Navigation' }
		});
	}

	onAddCart() {
		let showDialogue =
			_get(this.info.activeProduct, ['productOptions', 'length']) > 0 &&
			_get(this.selectedOptionValues, ['length']) !== _get(this.info.activeProduct, ['productOptions','length']);

		if (showDialogue) {
			const dOptions = [];
			this.info.activeProduct.productOptions.forEach((option, index) => {
				if (!_get(this.selectedOptionValues, [index]) && _get(this.info.activeProduct, ['productOptionValues', 'length']) > 0)
					dOptions.push({
						value: option.name,
						font_size: '16px',
						color: '#8c8c8c'
					});
			});

			if (dOptions.length > 0) {
				const attentionWindow = createAttentionDialogWindow(
					this.windowService,
					new AttentionInfo(
						{ value: 'You must choose', font_size: '22px', color: '#8c8c8c' },
						dOptions,
						true,
						['OK'],
						''
					)
				);
				attentionWindow.componentRef.instance.submit.subscribe(feedback => {
					attentionWindow.destroy();
				});
				attentionWindow.componentRef.instance.close.subscribe(feedback => {
					attentionWindow.destroy();
				});
				attentionWindow.open();
			} else {
				this.checkOut = true;
			}

		} else {
			this.checkOut = true;
		}
	}

	private dragStartItem: ProductItem;
	private dragOverItem: ProductItem;
	private _dragStartIndex = -1;
	private _dragOverIndex = -1;

	onDragStart(e) {
		// if (this.selected) return;
		// this.dragStartItem = this.viewItems[e.index];
		this._dragStartIndex = e.index;
	}

	onDragOver(e) {
		// if (this.selected) return;
		// if (this.dragStartItem !== this.viewItems[e.newIndex])
		// 	this.dragOverItem = this.viewItems[e.newIndex];
		this._dragOverIndex = e.newIndex;
	}

	onDragEnd(e) {
		// if (this.selected) return;

		if (this._dragStartIndex == this._dragOverIndex)
			return;

		// const startIndex = this._dragStartIndex + Math.max(this.info.page - 1, 0) * this.itemsPerPage;
		// const endIndex = this._dragOverIndex + Math.max(this.info.page - 1, 0) * this.itemsPerPage;
		const startIndex = this._dragStartIndex;
		const endIndex = this._dragOverIndex;

		const puid = this.info.products[endIndex].uid;

		if (this.info.showNavigation) {
			this.productService.changeProductSeqence({listingUid: this.info.activeListingUid, productUid: puid, sequence: endIndex + 1})
				.subscribe(
					res => {
						this.appService.publishSiteSub.next(true);
					},
					error => {}
				);
		}
		this.changeProductSequences(startIndex, endIndex);
	}

	changeProductSequences(startIndex, endIndex) {
		// const temp = this.info.products[startIndex];
		// this.info.products.splice(startIndex, 1);
		// this.info.products.splice(endIndex, 0, temp);
		if (!this.info.showNavigation)
			this.refreshView(false, 2);
	}

	refreshView(
		loading: boolean = false,
		willUpdate: number = 0,
		box: Box = null
	) {
		// willUpdate => 1: resize, 2: change
		this._loading = loading;
		// let pages = Math.ceil(this.info.products.length / this.itemsPerPage);

		// if (this.info.page > pages) this.info.page = Math.max(1, pages);
		// this.viewItems = this.info.products.slice(
		// 	this.itemsPerPage * (this.info.page - 1),
		// 	this.itemsPerPage * this.info.page
		// );

		this.viewItems = this.info.products;

		if (willUpdate > 0) {
			setTimeout(() => {
				if (willUpdate == 1) {
					if (box)
						this.itemResize.emit(box);
					else if (this.info.layoutType < 3)
						this.itemResize.emit(
							this.item.content.box.setBottom(
								this.item.content.box.top +
									(this.elementRef.nativeElement as HTMLElement).offsetHeight
							)
						);
				} else {
					this.info.productUids = this.info.products.map(p => p.uid);
					const temp = this.itemContent.setInfo(Maybe.just(this.info));
					let tempItem;
					if (box)
						tempItem = this.item.setContent(temp.setBox(box));
					else if (this.info.layoutType < 3)
						tempItem = this.item.setContent(
							temp.setBox(
								temp.box.setBottom(
									temp.box.top +
										(this.elementRef.nativeElement as HTMLElement).offsetHeight
								)
							)
						);
					else
						tempItem = this.item.setContent(temp);
					console.log(tempItem);
					this.itemChange.emit(tempItem);
				}
			});
		} else {
			// this.changeDetectRef.detectChanges();
		}
	}

	backgroundImage(item: ProductItem): SafeStyle {
		if (!item) return '';
		const img: ImagePath = item.images[0];
		return img ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(img)) : '';
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
