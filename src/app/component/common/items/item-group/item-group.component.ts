import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Item, ItemGroupContent, Link } from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'item-group',
	templateUrl: './item-group.component.html',
	styleUrls: ['./item-group.component.css']
})

export class ItemGroupComponent implements OnInit {
	@Input('item') group: Item;
	@Input() editable = false;
	@Input() selected = false;

	@Output() itemChange = new EventEmitter<Item>();
	@Output() outLink = new EventEmitter<Link>();

	items: Item[] = [];

	constructor() {}

	ngOnInit() {
		this.items = (this.group.content as ItemGroupContent).items;
		// this.items = lodash.orderBy((this.group.content as ItemGroupContent).items,['content.box.top', 'content.box.left'], ['asc', 'asc']);
	}

	onOutLink(event: Link) {
		this.outLink.emit(event);
	}

}
