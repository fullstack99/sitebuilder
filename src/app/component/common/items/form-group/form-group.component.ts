import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { Item, FormItemContent } from '@app-models/item-info';
import {
	get as _get
} from 'lodash';

@Component({
	moduleId: module.id,
	selector: 'form-group',
	templateUrl: './form-group.component.html',
	styleUrls: ['./form-group.component.css']
})

export class FormGroupComponent implements OnInit {
	@Input() item: Item;
	@Input() selected = false;
	@Input() readOnly = false;
	@Input() containerWidth: number = 1100;

	itemContent: FormItemContent;
	formType = 'M';

	constructor(private elementRef: ElementRef) {
	}

	ngOnInit() {
		this.itemContent = this.item.content as FormItemContent;
		const parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		parent.style.height = `${this.item.content.box.height() + 40}px`;
		this.formType = _get(this.itemContent, 'info.value.formType') || 'M';
	}
}
