import { Component, Input, OnInit, ChangeDetectorRef, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import { filter } from 'rxjs/operators';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	orderBy as _orderBy,
	isEqual as _isEqual,
	without as _without,
} from 'lodash';
import { createAttentionDialogWindow, AttentionInfo } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createNewEcommerceItemWindow  } from '@app/component/ecommerce/items/new-item/new-item.component';
import { Tree, ImagePath, Listing } from '@app/models';
import { ProductItem } from '@app-models/ecommerce';
import { AlertService, TreeService, ProductService } from '@app/services' ;
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';

@Component({
	selector: 'catalog-navigation',
	templateUrl: './catalog-navigation.component.html',
	styleUrls: [
		'../items-grid/items-grid.component.css',
		'./catalog-navigation.component.css'
	]
})

export class CatalogNavigationComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

	@Input('newItem') newItem: ProductItem;

	public items: Array<ProductItem> = [];
	public skip = 0;
	public take = 1000;

	public expandable = false;
	public productLisitngs: Array<Array<Listing>> = []; // productLisitngs[0]: Department, productLisitngs[1]: Collection, productLisitngs[2]: Brand

	public productListingTree: Tree<Listing>[] = []; // tree[0]: Department, tree[1]: Collection, tree[2]: Brand
	public editingIndex: number = -1;
	public selectedUids: Array<any> = [];
	public activeItem: ProductItem = null;

	public _loading: boolean = false;
	public activeOrderKey = 3;
	private orderKeys = [
		{orderKey: 'department', order: false },
		{orderKey: 'collection', order: false },
		{orderKey: 'brand', order: false },
		{orderKey: 'title', order: true }
	];

	private openedEditItemDiag = false;
	private oweSort = false;
	private viewInited = false;
	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	public showValueFunc = (s: Listing) => s.description;

	constructor(
		private _windowService: WindowService,
		private appService: AppService,
		private productService: ProductService,
		private alertService: AlertService,
		private treeService: TreeService,
		private changeDetectorRef: ChangeDetectorRef,
		private sanitizer: DomSanitizer
	) { }

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

		this.items = [];
		this.getProductListing(listingUids);
		this._loading = true;
		this.callingAPI = this.productService.getProducts(this.skip, this.take, [_get(listingUids, [0])] , true, true).subscribe(
			res => {
				this.items = res;
				this.setOrderKeys(this.items);
				this.onSort(this.activeOrderKey, false);
			},
			error => {
				this.refreshView();
			},
			() => {}
		);

		this.subs = [
			this.treeService._renameAndCheckedTree.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.updateList(res[0], res[1], res[2], res[3])
			}),

			this.treeService._deleteTree.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.removeList(res[0], res[1]);
			}),

			this.treeService._addAndCheckedTree.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.addList(res[0], res[1]);
			}),
			this.treeService._checkedTree.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.setProductProductListing(this.items[this.editingIndex].uid, res[0].value['uid'], res[1]);
			}),
			this.treeService._changeSequence.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.changeProductListingSequence(res[0], res[1], res[2]);
			}),
			this.treeService._titleOnlyTree.pipe(filter(res =>res[0].type == 'productListing')).subscribe(res => {
				this.updateListTitleOnly(res[0], res[1]);
			}),
		];
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
		if (changes['newItem'] && this.newItem) {
			this.setOrderKeys([this.newItem]);
			this.items.push(this.newItem);
			this.onSort(this.activeOrderKey, false);
		}
	}

	setOrderKeys(items: ProductItem[]) {
		items.forEach((item, index) => {
			this.getTitle(0, item);
			this.getTitle(1, item);
			this.getTitle(2, item);
		});
	}

	getTitle(i: number, item: ProductItem) {
		if (this.productLisitngs.length < 3)  return '';
		if (!this.productLisitngs[i]) return '';

		const temp = this.productLisitngs[i].filter(pl => !pl.isTitle && item.listingUids.findIndex(luid => luid.uid == pl.uid) >= 0);
		if (temp.length > 0) {
			item[this.orderKeys[i].orderKey] =  temp[0].description	+ (temp.length > 1 ? ' (multi)' : '');
			item[this.orderKeys[i].orderKey + '_listingUid'] = temp[0].uid;
			item[this.orderKeys[i].orderKey + '_sequence'] = item.listingUids[item.listingUids.findIndex(luid => luid.uid == temp[0].uid)].sequence;
		} else {
			item[this.orderKeys[i].orderKey] = '';
			item[this.orderKeys[i].orderKey + '_listingUid'] = '';
			item[this.orderKeys[i].orderKey + '_sequence'] = 0;
		}
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	onEditItem(p: ProductItem) {
		this.activeItem = p;
		this.openedEditItemDiag = true;
		const newItem = createNewEcommerceItemWindow(this._windowService, p.uid, _cloneDeep(p));
		newItem.componentRef.instance.submit.subscribe(res => {
			newItem.destroy();
			this.openedEditItemDiag = false;
			let i = this.items.findIndex(item => item.uid == res.uid);
			if (i >= 0) {
				this.setOrderKeys([res]);
				this.items[i] = res;
				this.onSort(this.activeOrderKey, false);
			}
		});
		newItem.componentRef.instance.close.subscribe(() => {
			newItem.destroy();
			this.openedEditItemDiag = false;
		});
		newItem.open();
	}

	getProductListing(listingUids: string[] = []) {
		for (let i = 0; i < 3; i++) {
			this.productService.getProductListing(i + 4).subscribe(
				res => {
					// this.productLisitngs[i] = _orderBy(res, ['description'], ['asc']);
					this.productLisitngs[i] = res.filter(i => !i.parentUid || (listingUids.length > 0 ? listingUids.findIndex(i.uid) >= 0 : true));
					if (res.length > 0) {
						this.treeService._trees['productListing' + i] = 
								new Tree<Listing>(
									'productListing',
									{ parentUid: null, description: 'ProductLisitng' + i, uid: '', type: i + 4, sequence: -1, isTitle: false },
									Tree.buildTrees(
										'productListing',
										this.productLisitngs[i].filter(pl => pl.parentUid == null),
										pl => [pl, this.productLisitngs[i].filter(sl => sl.parentUid == pl.uid)]
									));	
						this.productListingTree[i] = this.treeService._trees['productListing' + i];
					} else {
						this.productListingTree[i] = new Tree('productListing', new Listing(null, 'ProductLisitng' + i, i + 4, -1, ''));
					}
				},
				error => {},
				() => {}
			);
		}
	}

	onSort(event: number, changeOrder: boolean = true) {
		this.activeOrderKey = event;
		if (changeOrder)
			this.orderKeys[event].order = !this.orderKeys[event].order;
		if (this.orderKeys[event].orderKey != 'title') {
			this.items = _orderBy(this.items, [this.orderKeys[event].orderKey, item => item[this.orderKeys[event].orderKey + '_sequence']], [this.orderKeys[event].order ? 'asc' : 'desc', 'asc']);
		} else {
			this.items = _orderBy(this.items, [this.orderKeys[event].orderKey], [this.orderKeys[event].order ? 'asc' : 'desc']);
		}
		this.editingIndex = -1;
		this.refreshView();
	}

	checkExpandable(listingTree: Tree<Listing>) {
		if (this.treeService)
		if (this.treeService._expandedUids.indexOf(listingTree.value.uid) >= 0)
			return true;
		if (listingTree.children && listingTree.children.length > 0) {
			for (let i = 0; i < listingTree.children.length; i++) {
				if (this.checkExpandable(listingTree.children[i]))
					return true;
			}
		}
		return false;
	}

	onEditing(i, event) {
		if (event) {
			this.selectedUids = [].concat(this.items[i].listingUids);
			this.editingIndex = i;
		} else {
			this.selectedUids = [];
			this.editingIndex = -1;
			if (this.oweSort) {
				this.onSort(this.activeOrderKey, false);
				this.oweSort = false;
			}
		}
		this.refreshView();
	}

	addList(parent: Tree<Listing>, description: string) {
		this.productService.addProductListing({ parentUid: parent.value['uid'], description: description, type: parent.value['type'] }).subscribe(
			res => {
				if (res) {
					parent.children.push(new Tree('productListing', res));
					this.productLisitngs[parent.value.type - 4].push(res);
				}
				this.refreshView();
			},
			error => {
				console.log(error);
				this.alertService.playToast('Fail', 'Listing Add Failed', 1);
				this.refreshView();
			},
			() => {}
		);
	}

	updateList(parent: Tree<Listing>, tree: Tree<Listing>, description: string, checked: boolean) {
		if (this.treeService._deletingUid == tree.value.uid) return;
		if (parent) {
			let temp = parent.children.findIndex(c=> !_isEqual(c, tree) && this.showValueFunc(c.value) == description);
			if (temp >= 0) {
				this.alertService.playToast('Warning', 'There is a listing that has the same name.', 2);
				return;
			}
		}

		let temp = _cloneDeep(tree.value);
		temp.description = description;

		this.productService.updateProductListing(temp).subscribe(
			res => {
				console.log(res);
				if (res) {
					// this.alertService.playToast('Success', 'Listing updated successfully.', 0);
					temp = _cloneDeep(tree);
					temp.value = res;
					const index = parent.children.findIndex(ch => ch == tree);
					if (index >= 0)
						parent.children[index] = temp;
					const i = this.productLisitngs[tree.value.type - 4].findIndex(pl => pl.uid == tree.value.uid);
					if (i >= 0 ) {
						this.productLisitngs[tree.value.type - 4][i].description = description;
					}
				}
				this.refreshView();
			},
			error => { 
					console.log(error);
					this.alertService.playToast('Failed', 'Listing is not updated.', 1);
					this.refreshView(); },
			() => {  }
			);
	}

	updateListTitleOnly(tree: Tree<Listing>, titleOnly: boolean) {
		if (this.treeService._deletingUid == tree.value.uid) return;

		let temp = _cloneDeep(tree.value);
		temp.isTitle = titleOnly;

		this.productService.updateProductListing(temp).subscribe(
			res => {
				if (res) {
					// this.alertService.playToast('Success', 'Listing updated successfully.', 0);					
					tree.value.isTitle = res.isTitle;
					this.setOrderKeys(this.items);
				}
				this.refreshView();
			},
			error => {
					this.alertService.playToast('Failed', 'Listing is not updated.', 1);
					this.refreshView(); },
			() => {  }
			);
	}

	removeList(parent: Tree<Listing>, tree: Tree<Listing>) {
		const attentionWindow = createAttentionDialogWindow(
			this._windowService,
			new AttentionInfo(
				{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'You are about to delete a Listing.', font_size: '16px', color: '#8c8c8c' },
					{ value: 'Sub-listings will not be Deleted.', font_size: '16px', color: '#8c8c8c' },
				],
				true,
				['YES', 'NO'],
				''
			));

		attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			attentionWindow.destroy();
			if (feedback) {
				this.treeService._deletingUid = tree.value['uid'];
				this.productService.deleteProductListing(tree.value['uid']).subscribe(
					res => {
						if (!res) {
							this.alertService.playToast('Failed', 'List is not Failed.', 1);
						} else {
							// this.alertService.playToast('Success', 'List removed successfully.', 0);
							this.treeService._deletingUid = '';
							parent.children = parent.children.filter(t => t !== tree);
							this.items.forEach(i => {
								i.listingUids = i.listingUids.filter(luid => luid.uid !== tree.value['uid']);
							});
							this.setOrderKeys(this.items);
							this.productLisitngs[tree.value.type - 4] = this.productLisitngs[tree.value.type - 4].filter(pl => pl.uid !== tree.value.uid);
						}
						this.refreshView();
					},
					error => {
						console.log(error);
						this.refreshView();
					},
					() => {
					}
				);
			}
		});

		attentionWindow.open();

	}

	setProductProductListing(pUid: string, listingUid: string, checked: boolean) {
		if (checked) {
			this.productService.insertProductProductListing(pUid, listingUid)
				.pipe()
				.subscribe(
					res => {
						if (res) {
							this.selectedUids = [...this.selectedUids, {uid: listingUid, sequence: res}];
							this.items[this.editingIndex].listingUids = [].concat(this.selectedUids);
							this.setOrderKeys([this.items[this.editingIndex]]);
							if (this.editingIndex >= 0) {
								this.oweSort = true;
							} else {
								this.onSort(this.activeOrderKey, false);
							}
						}
						this.refreshView();
					},
					error => {
						this.refreshView();
					},
					() => {}
				)
		} else {
			this.productService.deleteProductProductListing(pUid, listingUid)
				.pipe()
				.subscribe(
					res => {
						if (res) {
							this.selectedUids = [].concat(this.selectedUids);
							this.selectedUids = this.selectedUids.filter(suid => suid.uid !== listingUid);
							this.items[this.editingIndex].listingUids = [].concat(this.selectedUids);
							this.setOrderKeys([this.items[this.editingIndex]]);
							if (this.editingIndex >= 0) {
								this.oweSort = true;
							} else {
								this.onSort(this.activeOrderKey, false);
							}
						}
						this.refreshView();
					},
					error => {
						console.log(error);
						this.refreshView();
					},
					() => {}
				)
		}
	}

	changeProductListingSequence(parent: Tree<Listing>, tree: Tree<Listing>, sequence: number) {
		let temp = [];
		parent.children.forEach((ch, index) => {
			temp.push({uid: ch.value['uid'], sequence: index});
		})
		console.log('change lisitings', temp, parent);
		this.productService.changeProductListingSeqence(temp)
			.pipe()
			.subscribe(
				res => {
					console.log('changed lisitings', res);
					this.setOrderKeys([this.items[this.editingIndex]]);
					this.refreshView();
				},
				error => {
					console.log(error);
					this.refreshView();
				},
				() => {}
			)
	}

	backgroundImage(url: ImagePath): SafeStyle {
		return url && url.name != '' ? this.sanitizer.bypassSecurityTrustStyle(`url('${url.location + '/' + encodeURIComponent(url.name)}')`) : '';
	}

	onClickedOutside(event) {
		this.selectedUids = [];
		this.editingIndex = -1;
		if (this.openedEditItemDiag)
			return;
			
		if (this.oweSort) {
			this.onSort(this.activeOrderKey, false);
			this.oweSort = false;
		}
		this.activeItem = null;
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		if (!this.viewInited) return;
		this.changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.treeService._expandedUids = [];
		this.subs.forEach(s=>s.unsubscribe());
	}
}
