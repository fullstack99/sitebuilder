import { Component, OnInit,	OnChanges, AfterViewInit, ChangeDetectorRef, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExpandableGroupComponent } from '../expandable-group.component';
import { ExpandableComponent } from '../../expandable.component';

@Component({
	moduleId: module.id,
	selector: 'expandable-input-group',
	templateUrl: './expandable-input-group.component.html',
	styleUrls: [
		'./expandable-input-group.component.css',
		'../expandable-group.component.css'
	]
})

export class ExpandableInputGroupComponent extends ExpandableGroupComponent implements OnInit, OnChanges, AfterViewInit {

	@ViewChildren('expandable') expandables: QueryList<ExpandableComponent>;
	
	private viewInited: boolean = false;

	constructor(
		protected _changeDetector: ChangeDetectorRef,
		protected _formBuilder: FormBuilder) {
			super(_changeDetector, _formBuilder);
		}

	ngOnInit() {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
		this.initValue();
    }

	ngAfterViewInit() {
		this.viewInited = true;
		this.initValue();
	}

	initValue() {
		if (this.listings) {			
			this.expandables['_results'].forEach((f: ExpandableComponent, index) => {
				let children = [];
				for(let i = 0; i < this.listings[index].productOptionValues.length; i++) {					
					children.push({value: this.listings[index].productOptionValues[i].name, children: []});
				}

				if (children.length == 0 ) {
					children= [{
						value: '',
						children: []
					}];
				}
									
				f.setFormValue(
					{				
						root: this.listings[index].name,
						children: children
					}
				);				
			});
		}
	}	
}  