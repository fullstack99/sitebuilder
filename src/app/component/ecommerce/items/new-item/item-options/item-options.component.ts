import { Component, OnInit, OnChanges, AfterViewInit, Input, Output, SimpleChanges, ChangeDetectorRef, EventEmitter } from "@angular/core";
import { SafeStyle, DomSanitizer } from "@angular/platform-browser";
import * as lodash from "lodash";
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { createOptionSettingsWindow } from "@app/component/ecommerce/items/new-item/item-options/option-settings/option-settings.component";
import { createImageImportDialogWindow } from "@app-dialogs/image-import-dialog/image-import-dialog.component";
import { ProductInventory, ProductOption, ProductOptionValue } from "@app-models/ecommerce";
import { ImagePath } from "@app/models";
import { WindowService } from "@app-common/window/window.service";

@Component({
	moduleId: module.id,
	selector: "product-item-options",
	templateUrl: "./item-options.component.html",
	styleUrls: ["./item-options.component.css"]
})
export class ItemOptionsComponent implements OnInit, OnChanges, AfterViewInit {
	@Input() isNew: boolean = false;
	@Input() subCode: string = "";
	@Input() price: number = 0;
	@Input() productInventories: Array<ProductInventory>;
	@Input() productOptions: Array<ProductOption>;
	@Input() currentOptionIndex: number = 0;

	@Output() columnChanged = new EventEmitter<number>();
	@Output() productOptionChanged = new EventEmitter<boolean>();
	
	public showDetailGrid: boolean = false;
	public numberOfExpandables: number = 3;
	public isError: boolean = false;

	private oldProductOptions: Array<ProductOption> = [];
	private selectedSort: { [k: string]: string } = {};
	private viewInited: boolean = false;

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private windowService: WindowService,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit(): void {
		this.initProductOptions();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
        if (changes['productOptions'] && changes['productOptions'].currentValue) {
			this.oldProductOptions[this.currentOptionIndex].productOptionValues.forEach((v, index) => {
				this.productInventories.forEach(pi=> {
					let newValue = changes['productOptions'].currentValue[this.currentOptionIndex].productOptionValues[index];
					if (pi['optionValue' + (this.currentOptionIndex + 1)] == (v.name ? v.name : null)) {
						pi['optionValue' + (this.currentOptionIndex + 1)] = newValue ? newValue.name : undefined;
					}
				})
			});
			console.log(lodash.cloneDeep(this.oldProductOptions[this.currentOptionIndex].productOptionValues), lodash.cloneDeep(this.productInventories))
			this.initProductOptions(true);
		}
		if (changes['subCode'] && changes['subCode'].currentValue) {
			let prefix = changes['subCode'].previousValue;
			if (!prefix)
				prefix = 'CTQX';
			this.productInventories.forEach(pi=> {
				if (pi.code.startsWith(prefix)) {
					pi.code = changes['subCode'].currentValue + pi.code.slice(prefix.length)
				}
			})
			this.productOptionChanged.emit(true);
		}
    }

	ngAfterViewInit() {
		this.viewInited = true;
	}

	private initProductOptions(refresh: boolean = false, emitValue: boolean = false) {
		while(this.productOptions.length < this.numberOfExpandables) {	
			let newProductOption = new ProductOption();
			newProductOption.editStatus = 'New';
			// newProductOption.optionValues.push(new ProductOptionValue('', this.isNew ? 'NoChange' : 'New'), new ProductOptionValue('', this.isNew ? 'NoChange' : 'New'));
			newProductOption.productOptionValues.push(new ProductOptionValue('', 'New'));
			newProductOption.sequence = this.productOptions.length + 1;
			this.productOptions.push(newProductOption);
		}		
		this.createInventories();
		this.productOptionChanged.emit(emitValue);

		if (refresh)
			this.refreshView();
	}

	public onRootChange(event) {
		let option = this.productOptions[event[0]];
		if (['New', 'NoChange'].indexOf(option.editStatus) < 0)
			option.editStatus = option.name.trim() == '' ? 'Deleted' : 'Modified';
		this.isError = !event[1];
		this.productOptionChanged.emit(true);
	}

	public onDetailChange(event: [number, number, any]) {
		this.showDetailGrid = true;
		const optionIndex = event[0];
		const detailIndex = event[1];
		let newValue = event[2].trim();
		let oldValue = null;

		let option = this.productOptions[optionIndex];

		if (detailIndex >= option.productOptionValues.length) {		
			// let optionDetail = new ProductOptionValue(newValue, this.isNew ? 'NoChange' : 'New');
			let optionDetail = new ProductOptionValue(newValue, 'New');
			option.productOptionValues.push(optionDetail);
		} else {
			let optionDetail = option.productOptionValues[detailIndex];
			if (['New', 'NoChange'].indexOf(optionDetail.editStatus) < 0) optionDetail.editStatus = 'Modified';
			oldValue == optionDetail.name;
			optionDetail.name = newValue;
		}
		this.createInventories(oldValue, newValue, optionIndex, detailIndex);
		this.refreshView(true);
	}

	public onDetailDelete(event: [number, number]) {
		const optionIndex = event[0];
		const detailIndex = event[1];
		this.productOptions[optionIndex].productOptionValues.splice(detailIndex,1);
		this.createInventories();
		this.refreshView(true);
	}

	public onSettingsClick() {
		const settingWindow = createOptionSettingsWindow(
			this.windowService,
			this.productOptions,
			this.selectedSort
		);
		settingWindow.componentRef.instance.sort.subscribe(res => {
			this.selectedSort = res;
			this.refreshView();
		});
		settingWindow.componentRef.instance.deleteAllOptions.subscribe(() => {
			settingWindow.destroy();
			this.productOptions = [];
			this.initProductOptions(true, true);
		});
		settingWindow.open();
	}

	public openImportDialog(inventory: ProductInventory) {
		let importDialog = createImageImportDialogWindow( this.windowService, false);
		importDialog.componentRef.instance.submit.subscribe(res => {
			importDialog.destroy();
			inventory.image = res;
			this.refreshView(true);
		});

		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});
		importDialog.open();
	}

	displayOptionDetails(inventory: ProductInventory): boolean {
		let keys = Object.keys(this.selectedSort);
		if (keys.length > 0) {
			let f = [];
			keys.forEach(key=> {
				if (inventory[key] == this.selectedSort[key])
					f.push(1);
			});
			return f.length == keys.length;
		}
		return true;
	}

	onVisibleInventory(inventroy: ProductInventory, visible: boolean) {
		inventroy.visible = visible;
		this.refreshView(true);
	}

	showForm() {
		this.showDetailGrid = !this.showDetailGrid;
		this.refreshView();
	}

	onModelChange(event, i: number) {
		console.log('changed', event);
		this.refreshView(true);
	}

	onColumnChanged(event) {
		this.currentOptionIndex = event;
		this.columnChanged.emit(event);
	}

	onClearListing(event) {
		let option = this.productOptions[event[0]];
		if (['New', 'NoChange'].indexOf(option.editStatus) < 0)
			option.editStatus = 'Deleted';
		this.isError = !event[1];
		option.name = '';
		option.productOptionValues = [new ProductOptionValue('', 'New')];
		this.createInventories();
		this.productOptionChanged.emit(true);
	}

	onChangeExpandableSequence(newIndexes: Array<number>) {
		this.productOptions = withArray(this.productOptions, ar =>
			newIndexes.forEach((di: number, i: number) => {
				ar[i + di] = this.productOptions[i];
				ar[i + di].sequence = (i + di + 1);
				if (!this.isNew && 'NoChange' == ar[i + di].editStatus)
					ar[i + di].editStatus = 'Sequence';
			}));
		this.renameOptionValue(newIndexes);
		this.createInventories();
		this.refreshView(true);
	}

	renameOptionValue(newIndexes: Array<number>) {
		let third = (newIndexes.indexOf(0) < 0);

		this.productInventories.forEach(p => {
			if (third) {
				let s = [p['optionValue1'], p['optionValue2'], p['optionValue3']];
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
	
	onChangeChildrenSequence(event: [number, number[]]) {
		let temp = this.productOptions.findIndex(po=>po.sequence == event[0] +1);
		if (temp < 0) return;
		this.productOptions[temp].productOptionValues = withArray(this.productOptions[temp].productOptionValues, ar =>
			event[1].forEach((di: number, i: number) => {
				ar[i + di] = this.productOptions[temp].productOptionValues[i];
			}));

		if (this.productInventories.length < 2) return;
		this.createInventories();
		this.refreshView(true);
	}

	createInventories(oldValue: string = null, newValue: string = null, optionIndex: number = null, detailIndex: number = null) {
		let optionValues = [[], [], []];
		if (this.subCode.endsWith('-000')) {
			this.subCode = this.subCode.slice(0, this.subCode.length - 4);
		}
		this.oldProductOptions = lodash.cloneDeep(this.productOptions);

		for (let i = 0; i < 3; i++) {
			let option = this.productOptions[i];
			if (option) {
				if (option.productOptionValues && option.productOptionValues.length > 0) {
					option.productOptionValues.forEach(v => {
						if (!!v.name)
							optionValues[i].push(v.name);
					});
				}
			}
			if (i > 0) {
				if (optionValues[i].length > 0) {
					for (let j=i-1; j>=0; j--)
						if (optionValues[j].length == 0)
							optionValues[j] = [null];
				}
				if (optionValues[i].length == 0 && optionValues[i-1].length > 0) {
					optionValues[i] = [null];
				}
			}
		}
		
		let newInventories = [];
		let num = 0;
		
		for (let i=0; i<optionValues[0].length; i++) {
			for(let j=0; j<optionValues[1].length; j++) {
				for(let k=0; k<optionValues[2].length; k++) {
					let inventory = this.productInventories.find(pi => {
						if (optionIndex != null) {
							if (optionIndex == 0 && detailIndex === i && pi.optionValue1 === oldValue) {
								pi.optionValue1 = newValue;
							} else if (optionIndex == 1 && detailIndex === j && pi.optionValue2 === oldValue) {
								pi.optionValue2 = newValue;
							} else if (optionIndex == 2 && detailIndex === k && pi.optionValue3 === oldValue) {
								pi.optionValue3 = newValue;
							}
						}						
						if (pi.optionValue1 != optionValues[0][i]) return false;
						if (pi.optionValue2 != optionValues[1][j]) return false;
						if (pi.optionValue3 != optionValues[2][k]) return false;
						if (pi.code.lastIndexOf('-0') > 0) {
							pi.code = pi.code.slice(0, pi.code.length - 4);
						}
						num += 1;
						pi.sequence = num;
						return true;
					});

					if (!inventory) {
						num += 1;
						inventory = new ProductInventory(0, '', '', 0, null, optionValues[0][i], optionValues[1][j], optionValues[2][k]);
						inventory.price = this.price;
						inventory.sequence = num;	
					}
					newInventories.push(inventory);

					// newInventories.push(inventories[0]);
				}
			}
		}

		newInventories = lodash.uniqBy(newInventories, (e) => {return e.optionValue1 + e.optionValue2 + e.optionValue3})
		let temp = newInventories.filter(ni=>ni.code == '');
		temp.forEach(t=> {	
			t.code = this.subCode != '' ? this.subCode : 'CTQX';
		});

		// newIndexes.forEach((n, index) => {
		// 	exists++;
		// 	let code = '' + exists;
		// 	let codeLen = code.length;
		// 	for (let c=codeLen; c<3; c++) {
		// 		code = '0' + code;
		// 	}
		// 	newInventories[n].code = (this.subCode != '' ? this.subCode : 'CTQX') + '-' + code;
		// });

		this.productInventories.splice(0, this.productInventories.length, ...newInventories);
		this.refreshView();
	}

	getNumber(i: number) {
		let code = '' + i;
		let codeLen = code.length;
		for (let c=codeLen; c<3; c++) {
			code = '0' + code;
		}
		return code;
	}
	
	// createInventories(oldValue: string = null, newValue: string = null, optionIndex: number = null, detailIndex: number = null) {
	// 	let optionValues = [[], [], []];
	// 	if (this.subCode.endsWith('-000')) {
	// 		this.subCode = this.subCode.slice(0, this.subCode.length - 4);
	// 	}		
	// 	this.oldProductOptions = lodash.cloneDeep(this.productOptions);

	// 	for (let i = 0; i < 3; i++) {
	// 		let option = this.productOptions[i];
	// 		if (option) {
	// 			if (option.productOptionValues && option.productOptionValues.length > 0) {
	// 				option.productOptionValues.forEach(v=> {				
	// 					if (!!v.name)
	// 						optionValues[i].push(v.name);
	// 				});
	// 			}
	// 		}
	// 		if (i > 0) {
	// 			if (optionValues[i].length > 0) {
	// 				for (let j=i-1; j>=0; j--)
	// 					if (optionValues[j].length == 0)
	// 						optionValues[j] = [null];
	// 			}
	// 			if (optionValues[i].length == 0 && optionValues[i-1].length > 0) {
	// 				optionValues[i] = [null];
	// 			}
	// 		}			
	// 	}
		
	// 	let newInventories = [];
	// 	let newIndexes = [];
	// 	let num = 0;
	// 	let exists = 0;
		
	// 	for (let i=0; i<optionValues[0].length; i++) {
	// 		for(let j=0; j<optionValues[1].length; j++) {
	// 			for(let k=0; k<optionValues[2].length; k++) {			
	// 				let inventories = this.productInventories.filter(pi => {
	// 					if (optionIndex != null) {
	// 						if (optionIndex == 0 && detailIndex === i && pi.optionValue1 === oldValue) {
	// 							pi.optionValue1 = newValue;
	// 						} else if (optionIndex == 1 && detailIndex === j && pi.optionValue2 === oldValue) {
	// 							pi.optionValue2 = newValue;
	// 						} else if (optionIndex == 2 && detailIndex === k && pi.optionValue3 === oldValue) {
	// 							pi.optionValue3 = newValue;
	// 						}
	// 					}						
	// 					if (pi.optionValue1 != optionValues[0][i]) return false;
	// 					if (pi.optionValue2 != optionValues[1][j]) return false;
	// 					if (pi.optionValue3 != optionValues[2][k]) return false;	
	// 					return true;
	// 				});
	// 				exists += inventories.length;
	// 				num += inventories.length;

	// 				if (inventories.length == 0) {
	// 					let inventory = new ProductInventory(0, '', '', 0, null, optionValues[0][i], optionValues[1][j], optionValues[2][k]);
	// 					inventory.price = this.price;
	// 					newIndexes.push(num);
	// 					num += 1;	
	// 					inventories = [inventory];
	// 				}
	// 				newInventories.push(...inventories);
	// 				// newInventories.push(inventories[0]);
	// 			}
	// 		}
	// 	}

	// 	let temp = newInventories.filter(ni=>ni.code == '' || ni.code.startsWith(this.subCode != '' ? this.subCode + '-' : 'CTQX-'));
	// 	let codeNum = 0;
	// 	temp.forEach(t=> {
	// 		codeNum++;
	// 		let code = '' + codeNum;
	// 		let codeLen = code.length;
	// 		for (let c=codeLen; c<3; c++) {
	// 			code = '0' + code;
	// 		}
	// 		t.code = (this.subCode != '' ? this.subCode : 'CTQX') + '-' + code;
	// 	})
		
	// 	// newIndexes.forEach((n, index) => {
	// 	// 	exists++;
	// 	// 	let code = '' + exists;
	// 	// 	let codeLen = code.length;
	// 	// 	for (let c=codeLen; c<3; c++) {
	// 	// 		code = '0' + code;
	// 	// 	}
	// 	// 	newInventories[n].code = (this.subCode != '' ? this.subCode : 'CTQX') + '-' + code;
	// 	// });

	// 	this.productInventories.splice(0, this.productInventories.length, ...newInventories);
	// 	this.refreshView();
	// }

	backgroundImage(image: ImagePath): SafeStyle {
		return image && image.location ? this.sanitizer.bypassSecurityTrustStyle(`url('${image.location+'/'+image.name}')`) : '';
    }

	refreshView(changed: boolean = false) {
		if (changed)
			this.productOptionChanged.emit(true);
		else
        	this.changeDetectorRef.detectChanges();        
	}	
}