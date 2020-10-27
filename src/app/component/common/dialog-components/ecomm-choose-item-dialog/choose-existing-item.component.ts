import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { Validators, FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import {
	get as _get,
	orderBy as _orderBy,
	pull as _pull,
} from 'lodash';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ImagePath } from '@app/models';
import { ProductItem } from '@app/models/ecommerce';

import { ProductService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

/** */
export function createEcommChooseExistingItemWindow(
	windowService: WindowService,
	category: number,
	diagMode: string = 'single',
	selectedItem: ProductItem = null,
	selectedItemUids: string[] = []
): DialogWindow<EcommChooseExistingItemComponent> {
	return windowService.create<EcommChooseExistingItemComponent>(
		EcommChooseExistingItemComponent,
		{
			width: 380,
			height: 700,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.category = category;
		comp.diagMode = diagMode;
		comp.selectedItem.setValue(selectedItem);
		comp.selectedItemUids = selectedItemUids;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'choose-existing-item.component.html',
	styleUrls: ['choose-existing-item.component.css']
})
export class EcommChooseExistingItemComponent implements OnInit, OnDestroy {
	@Input() category: number = -1;
	@Input() diagMode: string = 'single';
	@Input() selectedItemUids = [];
	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<ProductItem | string | string[]>();
	@ViewChild('productsContainer') productsContainer: ElementRef;

	public items: any = [];
	public filteredItems: any = [];
	public listingUids = [];
	public stopScrolling = false;

	public itemName: string = "";
	public search = new FormControl('');
	public selectedItem = new FormControl(null, [Validators.required]);	
	public _loading: boolean = false;
	public productsContainerScroll = new Subject<void>();

	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private appService: AppService,
		private productService: ProductService,
		private sanitizer: DomSanitizer,
		private windowService: WindowService
	) {}

	ngOnInit() {
		this._loading = true;
		
		if (this.appService._currentPage) {
			const ecommItems = this.appService._currentPage.items.filter(i => i.itemType == 'EcommerceItem');
			for (let i = 0; i < ecommItems.length; i++) {
				const temp = _get(ecommItems[i], 'content.info.value.listingUids') || [];
				for (let j = 0; j < temp.length; j++) {
					if (temp[j])
						this.listingUids.push(temp[j]);
				}
			}
		}

		if (this.category == -1) {
			this.getProducts(0, 12, [_get(this.listingUids, [0])]);
		} else {
			this.productService.getProductListing(this.category).subscribe(
				res => {
					res.forEach(e => {
						if (e.parentUid == null) {
							this.items.push({title: e.description, uid: e.uid});
						}
					});
					this.filteredItems = _orderBy(this.items, ['title']);
					this.refreshView();
				},
				error => { this.refreshView(); },
				() => {}
			)
		}

		this.subs = [
			this.search.valueChanges.subscribe(res => {
				this.filteredItems = this.items.filter(s => {
					if (this.search.value == '' || s.title.toString().toLowerCase().includes(this.search.value.toLowerCase()))
						return true;
				});
				this.changeDetector.detectChanges();
			}),
			this.selectedItem.valueChanges.subscribe(() => {
				this.changeDetector.detectChanges();
			}),
			this.productsContainerScroll.subscribe(() => {
				if (this.stopScrolling)
					return;
				const el = this.productsContainer.nativeElement as HTMLElement;
				if (el.scrollHeight - el.offsetHeight - el.scrollTop === 0) {
					this.getProducts(this.items.length, 12, [_get(this.listingUids, [0])]);
				}
			}),
		];
	}

	getProducts(skip, take, listingUids) {
		this.stopScrolling = true;
		this.callingAPI = this.productService.getProducts(skip, take, listingUids, true, true).subscribe(
			res => {
				this.stopScrolling = false;
				this.items.push(...res);
				this.filteredItems = this.items;
				// this.filteredItems = _orderBy(this.items, ['title']);
				this.refreshView();
			},
			error => {
				this.stopScrolling = false;
				this.refreshView();
			},
			() => {}
		)
	}

	onItemCheckChange(event, uid: string) {
		if (event.target.checked) {
			this.selectedItemUids.push(uid);
		}
		else {
			this.selectedItemUids = _pull(this.selectedItemUids, uid);
		}
		this.refreshView();
	}

	isItemChecked(uid: string) {
		return this.selectedItemUids.findIndex(i=>i==uid) >= 0;
	}
		
	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		if (this.diagMode == 'single') {
			if (this.selectedItem.invalid) return;
			if (this.category == -1) {
				this.submit.emit(this.filteredItems[this.selectedItem.value]);
			}
			else {
				this.submit.emit(this.filteredItems[this.selectedItem.value].uid);				
			}
		} else {
			if (this.selectedItemUids.length == 0) return;
			this.submit.emit(this.selectedItemUids);
		}		
	}   

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}	

	backgroundImage(url: ImagePath): SafeStyle {		
		return url && url.name ? this.sanitizer.bypassSecurityTrustStyle(`url('${url.location + "/" + encodeURIComponent(url.name)}')`) : '';
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;		
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
