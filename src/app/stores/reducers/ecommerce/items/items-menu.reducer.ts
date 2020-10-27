import { Type, Component } from '@angular/core';
import { ItemMenu } from '@app-models/ecommerce';
import { ItemsGridComponent } from '@app/component/ecommerce/items/items-grid/items-grid.component';
import { InventoryGridComponent } from '@app/component/ecommerce/items/inventory-grid/inventory-grid.component';
import { CatalogNavigationComponent } from '@app/component/ecommerce/items/catalog-navigation/catalog-navigation.component';

const initialState = [
	{
		id: 0,
		title: 'My Items',
		selected: true,
		componentType: ItemsGridComponent
	},
	{
		id: 1,
		title: 'Inventory',
		selected: false,
		componentType: InventoryGridComponent
	},
	{
		id: 2,
		title: 'Catalog Navigation',
		selected: false,
		componentType: CatalogNavigationComponent
	}
];

//export const reducer = (state: ItemMenu[] = initialState, action: { type: string, payload: ItemMenu }) => {
export const reducer = (state: any = initialState, action: { type: string, payload: ItemMenu }) => {
	switch(action.type) {
		case 'SELECT_ITEM_MENU':
			return state.map(itemMenu => {
				const selected = itemMenu.id == action.payload.id ? true : false;
				return { ...itemMenu, selected: selected };
			});
		default:
			return state;
	}
};
