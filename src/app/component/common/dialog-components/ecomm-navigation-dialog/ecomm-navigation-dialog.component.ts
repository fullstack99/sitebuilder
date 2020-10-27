import { Component, Input, Output, OnInit, ChangeDetectorRef, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { Listing } from '@app-models/index';
import { AlertService, ProductService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createEcommNavigationDialogWindow(
	windowService: WindowService,
	uid: string = ''
): DialogWindow<EcommNavigationDialogComponent> {
	return windowService.create<EcommNavigationDialogComponent>(
		EcommNavigationDialogComponent,
		{
			width: 360,
			height: 500,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.uid = uid;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'ecomm-navigation-dialog',
	templateUrl: 'ecomm-navigation-dialog.component.html',
	styleUrls: ['ecomm-navigation-dialog.component.css']
})
export class EcommNavigationDialogComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() uid: string = '';
		
	@Output('submit') submit = new EventEmitter<string>();
	@Output('close') close = new EventEmitter<void>();
		
	public _loading: boolean = false;
	public productListings: Array<Array<any>> = [[], [], []];
	public selectedListingUid: string;

	private callingAPI: Subscription;
	private viewInited = false;
	private subs: Subscription[] = [];

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private alertService: AlertService,
		private productService: ProductService,
		private windowService: WindowService
	) { }

	ngOnInit() {
		this.subs = [

		];
		this.refreshView(true);
		this.getPageProductListings(this.uid);
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	getPageProductListings(uid: string) {
		this.productService.getPageProductListing(uid).pipe().subscribe(
			res => {
				res = lodash.uniq(res);
				for (let i = 0; i < 3; i++) {
					let temp = res.filter(l => l.type == i + 4 && l.description !== '');

					this.productListings[i] = temp.filter(l => l.parentUid == null);
					this.productListings[i] = lodash.orderBy(this.productListings[i], ['sequence']);
					res = lodash.without(res, ...temp);
					temp = lodash.without(temp, ...this.productListings[i]);
					for (let j = 0; j < this.productListings[i].length; j++) {
						this.productListings[i][j]['subListing'] = temp.filter(l => l.parentUid == this.productListings[i][j].uid);
						this.productListings[i][j]['subListing'] = lodash.orderBy(this.productListings[i][j]['subListing'], ['sequence']);
						temp = lodash.without(temp, ...this.productListings[i][j]['subListing']);

						if (!this.selectedListingUid) {
							if (!this.productListings[i][j].isTitle) {
								this.selectedListingUid = this.productListings[i][j].uid;
							} else {
								let k = 0;
								while (k < this.productListings[i][j]['subListing'].length && !this.selectedListingUid) {
									if (!this.productListings[i][j]['subListing'][k].isTitle)
										this.selectedListingUid = this.productListings[i][j]['subListing'][k].uid;
									k++;
								}
							}
						}
					}
				}

				this.refreshView();
			},
			error => {
				this.alertService.playToast('Oops', 'Service Error', 1);
				this.refreshView();
			},
			() => {}
		);
	}

	onActiveListing(event: MouseEvent, listing: Listing) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (!listing.isTitle)
			this.submit.emit(listing.uid);
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	openFeedbackDialog(event: MouseEvent) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	onClose(event: MouseEvent) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		if (this.viewInited)
			this.changeDetectorRef.detectChanges()
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
