import { ImagePath } from '@app-models/image-info';

export interface OptionCombination {
	id: number;
	options: Array<Option>;
	price: number;
	image: ImagePath;
	inventory: number;
	code: string;
	barcodeUpc: string;
}

export class Promotion {
	constructor(
		public name: string = '',
		public code: string = '',
		public startDate: Date = new Date,
		public endDate: Date = new Date,
		public discountType: string = 'FreeShipping', // FreeShipping, Percentage, FixedPrice
		public amount: number = 0,
		public minimum: number = 0,
		public requireCodeEntry: boolean = false, // true: manually, false: auto
		public applyAllProducts: boolean = false,
		public listings: string[] = [],
		public products: string[] = [],
		public uid: string = '',
	) {}
}

export class ProductOption {
	constructor(
		public id: number = 0,
		public name: string = '',
		public editStatus: string = 'New', // 'NoChange', 'Modified', 'New', 'Deleted', 'Sequence'	
		public productOptionValues: Array<ProductOptionValue> = [],
		public sequence: number = 0
	) {}
}

export class ProductOptionValue {
	constructor(
		public name: string = "",
		public editStatus: string = 'New', // 'NoChange', 'Modified', 'New', 'Deleted', 'Sequence'
		public optionValueId: number = 0
	) {}
}

export class ProductInventory {
	constructor(
		public amount: number = 0,
		public barCodeUpc: string = null,
		public code: string = '',
		public id: number = 0,
		public image: ImagePath = null,
		public optionValue1: string = null,
		public optionValue2: string = null,
		public optionValue3: string = null,
		public price: number = 0,
		public visible: boolean = true,
		public sequence: number = 0
	) {}
}

export interface Option {
  	detail: string;
}

export class Listing {
	constructor(
		public value: string = "",
		public subListings: Array<string> = [""]
	) {}
}

export class ProductListing {
	constructor(
		public parentUid: string = "",
		public description:string = "",
		public type: number = 0,  // 4: Department, 5: Collection, 6: Brand
		public uid: string = ""
	) {}
}

export class EditListing {
	constructor(
		public value: string = "",
		public type: number = 0,
		public uid: string = "",
		public selected: boolean = false,
		public subListings: Array<EditSubListing> = []
	) {}
}

export class EditSubListing {
	constructor(
		public parentUid: string = "",
		public value: string = "",
		public type: number = 0,
		public uid: string = "",
		public selected: boolean = false
	) {}
}

export class ProductItem {
	constructor (
		public activeDate: Date = new Date(),
		public addOptions: boolean = false,
		public barCode: string = '',
		public createDate: Date = new Date(), // '2017-09-13T17:49:00'
		public description: string = '<p><span style="font-size: 14px;">&nbsp;</span></p>',
		public id: number = 0,
		public images: Array<ImagePath> = [],
		public inventoryCount: number = 0,
		public isTaxable: Boolean = false,
		public itemCode: string = '',
		public keywords: Array<string> = [],
		public listingUids: Array<any> = [],
		public onlineTime: number = 1,
		public price: number = 0,
		public priceComparison: number = 0,
		public productInventories: Array<ProductInventory> = [],
		public productOptions: Array<ProductOption> = [],
		public shipped: Boolean = false,
		public shippingDelivered: Boolean = false,
		public shippingHarmonizedCode: string = '',
		public shippingPickup: Boolean = false,
		public shippingWeight: number = 0,
		public status: number = 0,
		public title: string = '',
		public trackInventory: Boolean = false,
		public trackInventoryAmount: number = 0,
		public trackRemove: Boolean = false,
		public uid: string = '',
		public sequence: number = 0,
	) {}
}
