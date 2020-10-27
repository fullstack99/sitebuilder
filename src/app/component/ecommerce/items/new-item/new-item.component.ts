import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import {
	cloneDeep as _cloneDeep,
	orderBy as _orderBy,
	sortedUniq as _sortedUniq,
} from 'lodash';
import * as Rx from 'rxjs';
import { withArray } from '@app-lib/array/array';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { DateTimeComponent } from '@app-ui/datetime/datetime.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ItemOptionsComponent } from '@app/component/ecommerce/items/new-item/item-options/item-options.component';
import { createOptionLookUpWindow } from './item-options/option-lookup/option-lookup.component';
import { createProductKeywordsLookupWindow } from './item-keys/item-keywords-lookup.component';
import { Slide, ImagePath } from '@app/models';
import { ProductItem, ProductOption, ProductOptionValue } from '@app-models/ecommerce/items';
import { AlertService, ProductService } from '@app/services' ;
import { UUID } from '@app-lib/uuid/uuid.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createNewEcommerceItemWindow(
	windowService: WindowService,
	uid: string,
	productItem: ProductItem,
	listingUid: string = null,
	sequence: number = null
): DialogWindow<NewEcommerceItemComponent> {
  	return windowService.create<NewEcommerceItemComponent>(NewEcommerceItemComponent, {
		width: 620,
		height: 750,
		autoFocus: true,
		draggable: true,
		resizable: true,
		visible: false,
		scrollable: false,
		title: false
    })
    .changeInputs((comp, window) => {
		comp.uid = uid;
		comp.isNew = uid.length == 0;
		comp.initItem = productItem;
		comp.listingUid = listingUid;
		comp.sequence = sequence;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
    });
}

@Component({
	moduleId: module.id,
	selector: 'ecommerce-new-item',
	templateUrl: 'new-item.component.html',
	styleUrls: ['new-item.component.css']
})
export class NewEcommerceItemComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() uid = '';
	@Input() isNew = false;
	@Input() listingUid = '';
	@Input() sequence: number = null;

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<ProductItem>();

	@ViewChild('textEditor') textEditorElem: ElementRef;
	@ViewChild('itemMarketingSeoTags') itemMarketingSeoTags: ElementRef;
	@ViewChild('scheduleTime') scheduleTime: DateTimeComponent;

	@ViewChild(ItemOptionsComponent) itemOptionsComponent: ItemOptionsComponent;

	public form: FormGroup;
	public initItem: ProductItem;

	public textEditorEnabled = false;
	public keywords = new FormControl('');
	public images: Array<ImagePath> = [];
	public slides: Slide[] = [];
	public isValid = false;
	public loading = false;
	public currentOptionIndex = 0;
	public descriptionChars = 0;

	private productOptionChanged = new Rx.Subject<boolean>();
	private callingAPI: Rx.Subscription;
	private formChanged = false;
	private _viewInited = false;
	private _originFormData = {};
	private subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private formBuilder: FormBuilder,
		private changeDetectorRef: ChangeDetectorRef,
		private windowService: WindowService,
		private productService: ProductService,
		private alertService: AlertService
	) {
		this.form = this.formBuilder.group(new ProductItem());
		this.form.controls['title'].setValidators(Validators.required);
		this.form.controls['price'].setValidators(Validators.required);
		this.form.controls['images'].setValidators(Validators.required);
		this.form.controls['itemCode'].setValidators(Validators.required);
		this.form.setValue(new ProductItem());
	}

	ngOnInit() {
		if (!this.initItem && this.uid != '') {
			this.productService.getProduct(this.uid).subscribe(
				res => {
					this.initForm(res);
					this.setText();
				},
				error => {},
				() => {}
			);
		} else if (this.initItem) {
			this.initForm(this.initItem);
			this.setText();
		} else {
			this.initItem = new ProductItem();
		}

		this.subs = [
			this.productOptionChanged.pipe().subscribe(res => {
				if (this._viewInited && res)
					this.checkValid();
			}),
			this.form.valueChanges.pipe().subscribe(res => {
				if (!this._viewInited) {
					this._originFormData = _cloneDeep(res);
					return;
				}

				if (!this.formChanged) {
					['title', 'price', 'images', 'itemCode'].forEach(i => {
						if (this.form.controls[i].invalid || i == 'price' && this.form.value[i] == 0) {
							this.form.controls[i].markAsTouched();
						}
					});
					this.formChanged = true;
				}
				this.checkValid();
			})
		];
	}

	ngAfterViewInit() {
		this._viewInited = true;
		this.descriptionChars = (this.textEditorElem.nativeElement as HTMLDivElement).textContent.length;
		this.changeDetectorRef.detectChanges();
	}

	get isEmpty(): boolean {
		if (this.textEditorEnabled) return false;
		if ($(this.form.value['description']).text().trim() == '') return true;
		return false;
	}

	private checkValid() {
		if (!differenceDeep.isDifference(this.form.value, this._originFormData)) {
			this.isValid = false;
			this.refreshView();
			return;
		}

		if (this.form.value['addOptions'] && this.itemOptionsComponent && this.itemOptionsComponent.isError) {
			this.isValid = false;
		} else if (differenceDeep.isDifference(this.form.value, this.initItem, ['productOptions'])) {
			if (this.form.valid && !this.form.value['price'] && this.isVisiblePrice())
				this.isValid = false;
			else
				this.isValid = this.form.valid;
		} else if (this.form.value['addOptions']) {
			let temp = _cloneDeep(this.form.value['productOptions']);
			temp = temp.filter(t => t.name != '');
			temp.forEach(i => {
				i.productOptionValues = i.productOptionValues.filter(ov => !!ov.name);
			});
			if (differenceDeep.isDifference(temp, this.initItem.productOptions, ['editStatus'])) {
				this.isValid = this.form.valid;
			} else {
				this.isValid = false;
			}
		} else {
			this.isValid = false;
		}
		this.refreshView();
	}

	private setText() {
		if (this.textEditorElem) {
			(this.textEditorElem.nativeElement as HTMLElement).innerHTML = this.form.value['description'];
		}
	}

	private initForm(item: ProductItem) {
		let temp = _cloneDeep(item);
		let newItem = new ProductItem;

		Object.keys(newItem).forEach(k => {
			if (temp[k])
				newItem[k] = temp[k];
		});

		if (this.listingUid) {
			const exist = newItem.listingUids.find(lUid => lUid.uid == this.listingUid);

			if (!exist)
				newItem.listingUids.push({uid: this.listingUid, sequence: this.sequence});
		}

		this.images = newItem.images;
		this.getSlides();

		newItem.productOptions = _orderBy(newItem.productOptions, ['sequence']);
		newItem.productInventories = _orderBy(newItem.productInventories, ['id']);

		if (newItem.productInventories.length > 0 && newItem.productOptions.length > 0 )
			newItem.addOptions = true;

		if (newItem.keywords)
			this.keywords.setValue(newItem.keywords.join(','), {emitEvent: false});
		else
			this.keywords.setValue('', {emitEvent: false});

		this.initItem = _cloneDeep(newItem);
		this.form.setValue(newItem);
	}

	generateCode(length: number = 6) {
		let output = '';
		const choices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		for (let i = 0; i < 4; i++) {
		  output += choices.charAt(Math.floor(Math.random() * choices.length));
		}
		output += '-000';
		this.form.controls['itemCode'].setValue(output);
	}

	getSlides() {
		this.slides  = [];
		if (this.images.length > 0) {
			this.images.forEach(image => {
				const slide = new Slide();
				slide.image = image;
				this.slides.push(slide);
			});
		}
	}

	result(event: any) {
		this.images = [];
		event.forEach(e => {
			if (e.image && this.images.indexOf({ location: e.image.location, name: e.image.name }) < 0) {
				this.images.push({
					location: e.image.location,
					name: e.image.name
				});
			}
		});
		this.form.controls['images'].setValue(this.images);
		this.refreshView();
	}

	setKeywords(event: any) {
		let keywords = event.split(',');
        if (keywords.length == 1 && keywords[0] == '')
            keywords = [];
		this.form.controls['keywords'].setValue(keywords);
	}

	initialProductOptions() {
		if (!this.form.controls['addOptions'].value) {
			this.form.controls['productOptions'].setValue([]);
			this.initItem['productOptions'] = [];
			this.form.controls['productInventories'].setValue([]);
			this.initItem['productInventories'] = [];
		}
	}

	isVisiblePrice() {
		return this.form.value['productInventories'].findIndex(pi => pi.price != this.form.value['price']) < 0;
	}

	isMultipleItemCode() {
		const codes = _sortedUniq(this.form.value['productInventories'].map(pi => pi.code));
		if (codes.length == 0)
			return false;
		if (codes.length == 1) {
			if (!this.form.value['itemCode']) {
				this.form.controls['itemCode'].setValue(codes[0], {emitEvent: false});
				return false;
			} else
				return codes[0] != this.form.value['itemCode'];
		}
		return true;
	}

	onTextEditorClick(event: MouseEvent): void {
		event.stopPropagation();
		if (!this.textEditorEnabled) {
			this.textEditorEnabled = true;
		}
		this.refreshView();
	}

	onTextFocusOut() {
		this.textEditorEnabled = false;
		this.refreshView();
	}

	onTextEditorInput(event: string): void {
		this.form.controls['description'].setValue(event);
		this.descriptionChars = (this.textEditorElem.nativeElement as HTMLDivElement).textContent.length;
	}

	onEditorDestroyed(event) {
		this.form.controls['description'].setValue(event);
	}

	onColumnChanged(event) {
		this.currentOptionIndex = event;
	}

	onOpenOptionLookUp(event: MouseEvent) {
		event.stopPropagation();
		let optionLookUp = createOptionLookUpWindow(this.windowService);
		optionLookUp.componentRef.instance.submit.subscribe(res => {
			optionLookUp.destroy();

			let options: ProductOption[] = [].concat(this.form.value['productOptions']);
			options[this.currentOptionIndex].name = res.name;
			options[this.currentOptionIndex].productOptionValues = [];
			res.productOptionValues.forEach((v, index) => {
				options[this.currentOptionIndex].productOptionValues[index] = new ProductOptionValue(v.name, 'New');
			});
			this.form.controls['productOptions'].setValue(options);
			setTimeout(() => {
				this.currentOptionIndex = Math.min(this.currentOptionIndex+1, 2);
			});
		});
		optionLookUp.componentRef.instance.close.subscribe(() => {
			optionLookUp.destroy();
		});
		optionLookUp.open();
	}

	onOpenKeywordsLookUp(e: MouseEvent) {
		e.stopPropagation();
		const diag = createProductKeywordsLookupWindow(this.windowService, this.form.value.keywords);
		diag.componentRef.instance.submit.subscribe(res => {
			diag.destroy();
			const keywords = res.map(r => r.keyword);
			this.form.controls['keywords'].setValue(keywords);
			this.keywords.setValue(keywords.join(','), {emitEvent: false});
			this.checkValid();
		});
		diag.componentRef.instance.close.subscribe(() => {
			diag.destroy();
		});
		diag.open();
	}

	openFeedbackDialog(event: MouseEvent): void {
		event.stopPropagation();
		createFeedbackDialogWindow(this.windowService, 'eco.i.120').open();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetectorRef.detectChanges();
	}

	onSubmit(event: MouseEvent) {
		if (!this.isValid)
			return;
		event.stopPropagation();
		const newIndexes = [0, 0, 0];
		const productItem: ProductItem = _cloneDeep(this.form.value);
		productItem.images = this.images;

		if (!this.itemOptionsComponent) {
			productItem.productInventories = null;
			productItem.productOptions = [];

		} else {
			if (productItem.addOptions) {
				productItem.productOptions = [];
				this.itemOptionsComponent.productOptions.forEach((i, index) => {
					if (i.name.trim() === '' || i.editStatus === 'Deleted') {
						newIndexes[index] = newIndexes[index] + 2 - index;
						for (let j = index + 1; j < 3; j++) {
							newIndexes[j] = newIndexes[j] - 1;
						}
					}
					if (i.name.trim() !== '' || i.editStatus === 'Deleted') {
						const po: ProductOption = _cloneDeep(i);
						po.productOptionValues = po.productOptionValues.filter(p => p.name !== '' || p.editStatus === 'Deleted');
						productItem.productOptions.push(po);
					}
				});
			}

			if (!productItem.productOptions || productItem.productOptions.length === 0) {
				productItem.productInventories = null;
			} else {
				productItem.productInventories = _cloneDeep(this.itemOptionsComponent.productInventories);
				productItem.productInventories = productItem.productInventories.filter(pi => !!pi.code);

				if (newIndexes.find(i => i != 0 ) >= 0) {
					const third = (newIndexes.indexOf(0) < 0);
					productItem.productOptions.forEach((po, index) => {
						po.sequence = po.sequence + newIndexes[po.sequence - 1];
					});
	
					productItem.productInventories.forEach(p => {
						if (third) {
							const s = [p['optionValue1'], p['optionValue2'], p['optionValue3']];
							p['optionValue' + (newIndexes[0] + 1)] = s[0];
							p['optionValue' + (newIndexes[1] + 2)] = s[1];
							p['optionValue' + (newIndexes[2] + 3)] = s[2];
						} else {
							let index1 = newIndexes.findIndex(n=> n > 0);
							let index2 = newIndexes.findIndex(n=> n < 0);
							let s = p['optionValue' + (index1 + 1)];
							p['optionValue' + (index1 + 1) ] = p['optionValue' + (index2 + 1) ];
							p['optionValue' + (index2 + 1) ] = s;
						}
					});
	
				}
	
			}
		}

		if (this.uid == '') {
			productItem.uid = UUID.UUID();
			this.refreshView(true);
			this.callingAPI = this.productService.addProducts(productItem).subscribe(
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
							if (event.body) {
								this.alertService.playToast('Success', 'Item saved.', 0);
								let newItem = new ProductItem;
								Object.keys(newItem).forEach(k=> {
									if (event.body[k])
										newItem[k] = event.body[k];
								});
								this.submit.emit(newItem);
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.alertService.playToast('Failed', 'Item is not saved.', 1);
					this.refreshView();
				},
				() => {
				}
			);
		} else {
			console.log(productItem);
			this.refreshView(true);
			this.callingAPI = this.productService.updateProduct(productItem).subscribe(
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
							console.log('updated item', _cloneDeep(event.body))
							if (event.body) {
								this.alertService.playToast('Success', 'Item is updated.', 0);

								let newItem = new ProductItem;
								Object.keys(newItem).forEach(k=> {
									if (event.body[k])
										newItem[k] = event.body[k];
								});
								this.submit.emit(newItem);
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.alertService.playToast('Failed', 'Item is not updated.', 1);
					this.refreshView();
				},
				() => {
				}
			);
		}
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
	}

	onClose(event: MouseEvent): void {
		event.stopPropagation();
		this.close.emit();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
