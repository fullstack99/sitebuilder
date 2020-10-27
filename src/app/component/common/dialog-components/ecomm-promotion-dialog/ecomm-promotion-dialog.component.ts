import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createEcommChooseItemDialogWindow } from '@app-dialogs/ecomm-choose-item-dialog/ecomm-choose-item-dialog.component';
import { createEcommChooseExistingItemWindow } from '@app-dialogs/ecomm-choose-item-dialog/choose-existing-item.component';

import { Promotion } from '@app/models/ecommerce';

import { AlertService, ProductService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createPromotionDialogWindow(
	windowService: WindowService,
	info: Promotion

): DialogWindow<PromotionDialogComponent> {
	return windowService.create<PromotionDialogComponent>(
		PromotionDialogComponent,
		{
			width: 400,
			position: {
				left: 'calc(50% - 200px)',
				top: '50px'
			},
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.info = info;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'ecomm-promotion-dialog',
	templateUrl: './ecomm-promotion-dialog.component.html',
	styleUrls: [
		'../../../../../assets/styles/canvas-nav.css',
		'./ecomm-promotion-dialog.component.css'
	  ]
})

export class PromotionDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() info: Promotion;

	@Output() submit = new EventEmitter<Promotion>();
	@Output() close = new EventEmitter<void>();

	public form: FormGroup;
	public loading: boolean = false;
	public isValid: boolean = false;
	public newInfo: any = new Promotion;

	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private _fb: FormBuilder,
		private changeDetectorRef: ChangeDetectorRef,
		private alertService: AlertService,
		private productService: ProductService,
		private windowService: WindowService
	) {
		this.form = _fb.group(new Promotion);
		this.form.addControl('minimum1', new FormControl(''));
		this.form.addControl('amount1', new FormControl(''));
		this.form.controls['name'].setValidators(Validators.required);
		this.form.controls['code'].setValidators(Validators.required);
		this.form.controls['startDate'].setValidators(Validators.required);
		this.form.controls['endDate'].setValidators(Validators.required);
	}

	ngOnInit() {
		this.form.patchValue({
			name: this.info.name,
			code: this.info.code,
			startDate: this.info.startDate,
			endDate: this.info.endDate,
			discountType: this.info.discountType,
			minimum: !this.info.minimum || this.info.discountType != 'Percentage' ? '' : this.info.minimum,
			amount: !this.info.amount || this.info.discountType != 'Percentage' ? '' : this.info.amount,
			minimum1: !this.info.minimum || this.info.discountType != 'FixedPrice' ? '' : this.info.minimum,
			amount1: !this.info.amount || this.info.discountType != 'FixedPrice' ? '' : this.info.amount,
			requireCodeEntry: this.info.requireCodeEntry,
			applyAllProducts: this.info.applyAllProducts,
			listings: this.info.listings,
			products: this.info.products
		});

		this.newInfo['products'] = this.info.products;
		this.newInfo['listings'] = this.info.listings;

		this.subs = [
			this.form.valueChanges.subscribe((x) => {
				this.checkValid();
			})
		];
	}

	ngAfterViewInit() {

	}

	private checkValid() {
		if (this.form.invalid || this.form.value['listings'].length == '' && this.form.value['products'].length == 0) {
			this.isValid = false;
			return;
		}

		this.newInfo = lodash.cloneDeep(this.form.value);

		if (this.newInfo['discountType'] == 'FixedPrice') {
			this.newInfo['amount'] = this.newInfo['amount1'];
			this.newInfo['minimum'] = this.newInfo['minimum1'];
		} else if (this.newInfo['discountType'] == 'FreeShipping') {
			this.newInfo['amount'] = 0;
			this.newInfo['minimum'] = 0;
		}
		if (this.newInfo['amount']=='') this.newInfo['amount'] = 0;
		if (this.newInfo['minimum']=='') this.newInfo['minimum'] = 0;

		this.newInfo = lodash.omit(this.newInfo, ['amount1', 'minimum1']);

		if (differenceDeep.isDifference(this.newInfo, this.info)) {
			this.isValid = this.form.valid;
		} else {
			this.isValid = false;
		}
		this.refreshView();
	}

	clickCanvasTool(tool: string) {
		if (tool == 'Back')
			this.close.emit();
		else { // Save
			if (this.form.invalid) return;
			this.refreshView(true);
			this.callingAPI = this.productService.addPromotion(this.newInfo).pipe().subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							break;
						case HttpEventType.UploadProgress:
							// Compute and show the % done:
							// if (this.loadingComponent)
							// 	this.loadingComponent.set(Math.min(event.loaded/event.total * 100, 98));
							break;
						case HttpEventType.Response:
							this.refreshView();
							console.log(event.body);
							if (event.body) {
								this.submit.emit(event.body);
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.alertService.playToast('Failed', 'The promotion is not saved.', 1);
					this.refreshView();
				},
				() => {}
			)
		}
	}

	eventHandler(event: any) {
		if ([8, 46, 190].indexOf(event.keyCode) < 0 && (event.keyCode < 47 || event.keyCode > 57)) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	openExistingItem(category: number) {
		let chooseExistingItem = createEcommChooseExistingItemWindow(this.windowService, category, 'multiple', null, category > 0 ? this.newInfo['listings'] : this.newInfo['products']);
		chooseExistingItem.componentRef.instance.submit.subscribe(res => {
			chooseExistingItem.destroy();
			if (category == -1) {
				this.form.patchValue({
					products: res
				});
			}
			else {
				this.form.patchValue({
					listings: res
				});
			}
		});
		chooseExistingItem.componentRef.instance.close.subscribe(s => {
			chooseExistingItem.destroy();
		});
		chooseExistingItem.open();
	}

	openChooseItems(event: MouseEvent) {
		let chooseItems = createEcommChooseItemDialogWindow(this.windowService, true, false, 'multiple');
		chooseItems.componentRef.instance.submit.subscribe(res => {
			chooseItems.destroy();

			switch (res) {
				case "existItem":
					this.openExistingItem(-1);
					break;
				case "allExistItem":
					this.form.patchValue({ applyAllProducts: true });
					break;
				case "byDepartment":
					this.openExistingItem(4);
					break;
				case "byCollections":
					this.openExistingItem(5);
					break;
				case "byVendor":
					this.openExistingItem(6);
					break;
				default:
					break;
			}
		});
		chooseItems.componentRef.instance.close.subscribe(s => {
			chooseItems.destroy();
		});
		chooseItems.open();
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
		feedbackWindow.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
