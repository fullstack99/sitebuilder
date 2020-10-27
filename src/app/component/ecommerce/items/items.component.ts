import { Component, ComponentRef, ComponentFactoryResolver, ViewContainerRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ProductItem } from '@app/models/ecommerce';
import { WSDetail } from '@app/models';

import { createNewEcommerceItemWindow } from '@app/component/ecommerce/items/new-item/new-item.component';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'ecommerce-items',
	templateUrl: './items.component.html',
	styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {	
	public newItem: ProductItem;
	
	public tabs: WSDetail[] = [
		{id: 0, name: 'My Items'},
		{id: 1, name: 'Inventory'},
		{id: 2, name: 'Catalog Navigation'}
	];

	public activeTab: WSDetail = this.tabs[0];
	
	constructor(
		private windowService: WindowService,
		private route: ActivatedRoute
	) {}

    ngOnInit() {
		this.route.queryParams.subscribe(data => {
			if (data['selectPage']) {
				let temp = this.tabs.find(t=>t.name == data['selectPage']);
				if (temp) this.activeTab = temp;
			}				
		});
	}

	onSelectTab(event: WSDetail) {
		this.activeTab = event;
	}
	
	onAddItem(event: MouseEvent) {
		const newItem = createNewEcommerceItemWindow(this.windowService, '', null);
		newItem.componentRef.instance.submit.subscribe(res => {
			newItem.componentRef.destroy();
			this.newItem = res;
		});
		newItem.componentRef.instance.close.subscribe(s => {
			newItem.componentRef.destroy();
		});
		newItem.open();
	}
}