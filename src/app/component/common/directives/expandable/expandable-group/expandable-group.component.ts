import { ViewChildren, Component, Input, Output, TemplateRef, ContentChild, ChangeDetectorRef, QueryList, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ExpandableComponent } from '@app-directives/expandable/expandable.component';
import { ProductOption } from '@app-models/ecommerce';

@Component({
	selector: 'expandable-group',
	templateUrl: './expandable-group.component.html',
	styleUrls: ['./expandable-group.component.css']
})
export class ExpandableGroupComponent {
	@Input() numberOfExpandables: number;
	@Input() displayInline: boolean;
	@Input() listings: Array<ProductOption>;


	@Output() clearListing = new EventEmitter<[number, boolean]>();
	@Output() rootChange = new EventEmitter<[number, boolean]>();
	@Output() childChange = new EventEmitter<[number, number, any]>(); // expandable, child, value	
	@Output() childDelete = new EventEmitter<[number, number]>(); // expandable, child
	@Output() changeExpandableSequence = new EventEmitter<Array<number>>();
	@Output() changeChildrenSequence = new EventEmitter<[number, number[]]>();
	@Output() columnChanged = new EventEmitter<number>();

	@ContentChild('expandableTemplate') expandableTemplate: TemplateRef<any>;
	@ViewChildren('expandable') expandables: QueryList<ExpandableComponent>;

	public form: FormGroup;
	public errors: number[] = [];
	public changing: boolean = false; //true while dragging group

	public get expandablesCountArray(): Array<number> {
		return new Array(this.numberOfExpandables).fill(1);
	}

	public get expandableChildrenValues(): Array<Array<any>> {
		return this.expandables.toArray().map(e => e.childrenValues);
	}

	constructor(protected _changeDetector: ChangeDetectorRef,
				protected _formBuilder: FormBuilder) {}
	
	public onRootChange(i, event: string) {
		if (this.changing) return;

		this.listings[i].name = event;
		if (!event) {
			this.errors = this.errors.filter(error=>error != i);
			this._changeDetector.detectChanges();
			this.clearListing.emit([i, this.errors.length == 0]);			
		} else {
			let index = this.listings.findIndex((option, index) =>index != i && option.name != '' && option.name == event);
			if (index >= 0) {
				this.errors.push(i);
			}
			else {
				this.errors = this.errors.filter(error=>error != i);
			}
			this._changeDetector.detectChanges();			
			this.rootChange.emit([i, this.errors.length == 0]);
		}		
	}
	
	public onChildChange(expandableIndex: number, childIndex: number) {		
		this.childChange.emit([	expandableIndex, childIndex, this.expandables.toArray()[expandableIndex].childValueAt(childIndex)]);
	}

	public onChildDelete(expandableIndex: number, childIndex: number) {		
		this.childDelete.emit([
			expandableIndex,childIndex
		]);
	}

	public addChild(expandableIndex: number, childValue: string) {
		this.expandables.toArray()[expandableIndex].addChild(childValue);
	}

	public deleteChild(expandableIndex: number, childIndex: number) {
		this.expandables.toArray()[expandableIndex].deleteChildControl(childIndex);
	}

	public onDragEnd(newIndexes: number[]) {
		this.changing = true;
		const expandables = this.expandables.toArray();
		const expandableForms = new Array(expandables.length);
		newIndexes.forEach((ni, i) => {
			expandableForms[i + ni] = expandables[i].form.value;
		});

		expandableForms.forEach((form, index) => {
			expandables[index].setFormValue(form);			
		});
		this.changeExpandableSequence.emit(newIndexes);
		this.changing = false;
	}

	public onChildSequenceChange(expandableIndex: number, changes: number[]) {		
		this.changeChildrenSequence.emit([expandableIndex, changes]);
	}

	public clear(): void {
		this.expandables.forEach(e => e.clear());
	}

	public onColumnChanged(i: number) {		
		this.columnChanged.emit(i);
	}

	public detectChanges(): void {
		this._changeDetector.detectChanges();
	}

	public isError(i: number): boolean {		
		return this.errors.indexOf(i) >= 0;
	}
}
