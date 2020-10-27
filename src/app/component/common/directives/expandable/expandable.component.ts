import { ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormArray, FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import * as lodash from 'lodash';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { AttentionInfo } from '@app/models';
import { ExpandableValue, ExpandableChildValue } from '@app-directives/expandable/expandable-values';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

export interface ExpandableForm extends FormGroup {
  controls: {
    [key: string]: AbstractControl;
    root: FormControl;
    children: FormArray;
  };
}

export interface ChildForm extends FormGroup {
  controls: {
    [key: string]: AbstractControl;
    value: FormControl;
  };
}

export abstract class ExpandableComponent {
	@Input() children = new Array<ExpandableChildValue>();
	@Input() itemTitle: string;
	@Input() numberOfDefaultChildren = 0;
	@Input() subChildrenTitle: string;
	@Input() rootName: string;
	@Input() jsonFlag?: boolean;
	
	@Output() focused = new EventEmitter<boolean>();
	@Output() rootChange: EventEmitter<string>;
	@Output() childChange: EventEmitter<number>;
	@Output() childDelete: EventEmitter<number>;
	@Output() childJsonChange: EventEmitter<{}>;
	@Output() childSequenceChange = new EventEmitter<Array<number>>();	

	public form: ExpandableForm;
	public focusNum: number = -1;

	public _indexChange = new Subject<number[]>();
    public _dragStart = new Subject<number>();
	public _dragEnd = new Subject<number>();
    public _drag = new Subject<[number, number]>();

	public get childControls(): FormArray {
		return <FormArray>this.form.controls.children;
	}

	public get childrenValues(): Array<any> {
		return this.childControls.value;
	}

	public get hasRoot(): boolean {
		return this.rootName !== undefined;
	}

	public get hasSubChildren(): boolean {
		return this.subChildrenTitle !== undefined;
	}

	public hasChildren(index: number): boolean {
		const node = this.childControls.value[index];

		return node.children.length > 0;
	}

	private subs: Subscription[] = [];

	constructor(
		protected _changeDetector: ChangeDetectorRef,
		protected _formBuilder: FormBuilder,
		protected _windowService: WindowService) {}

	public ngOnInit(): void {

		let i = this.children.length;
		this.form = <ExpandableForm>this._formBuilder.group({
			root: [''],
			children: this._formBuilder.array([])
		});
		this.addDefaultchildControls();
		this.addExistingchildControls();

		if (this.children[0] && this.jsonFlag) {
			if (!this.children[0].value) {
				while (i < 2) {
					this.addEmptyChild(null);
					i++;
				}
			}
		}

		this.subs = [
			this._indexChange.pipe().subscribe(r=> {
				let children = this.form.controls['children'] as FormArray;
				let values = [];
				r.forEach((di, i) => {
					values[i + di] = children.value[i];
				});
				this.form.patchValue({
					children: values
				});
				this.childSequenceChange.emit(r);
				this.detectChanges();
            }),
            
            Observable.merge(
				this._dragStart,
                this._dragEnd,
                this._drag
            )
            .pipe()
            .subscribe(() => {
                this.detectChanges();
			}),
			this.form.valueChanges.subscribe(res => {
				this.detectChanges();
			}),
			this.form.controls.root.valueChanges.subscribe((value) => {
				if (!value) {
					this.adjustChildControlsCount(1);
					this.form.patchValue({ children: [{
						value: '',
						children: []
					}]});
				}
				this.rootChange.emit(value);
			}),
		]
	}

	public addDefaultchildControls(): void {
		const numberOfChildControls = this.childControls.length;
		const numberOfControlsToAdd = this.numberOfDefaultChildren - numberOfChildControls;
		for (let i = 0; i < numberOfControlsToAdd; i++) {
			this.addEmptyChild(null);
		}
	}

	public addExistingchildControls(): void {
		this.children.forEach((child, index) => {
			if (this.childControls.at(index)) {
				this.childControls.at(index).patchValue(child);
			} else {
				const group = this.initializeChildFormGroup('');
				group.patchValue(child);
				this.childControls.push(group);
			}
		});
	}

	public setFormValue(value: ExpandableValue) {
		this.adjustChildControlsCount(value.children.length);
		this.form.patchValue(value);
	}

	public adjustChildControlsCount(target: number) {
		const delta = target - this.childControls.length;
		if (delta < 0) {
			this.deleteChildControls(-delta);
		} else {
			this.addChildControls(delta);
		}		
	}

	public deleteChildControls(count: number) {
		while(count > 0) {
			count--;
			this.childControls.removeAt(count);
		}		
	}

	public addChildControls(count: number) {		
		for (let i = 0; i < count; i++) {
			this.childControls.push(this.initializeChildFormGroup(''));
		}
	}

	public clear(): void {
		this.form.controls.root.patchValue('');
		this.childControls.controls.forEach(c => c.patchValue({ value: '' }));
		this.adjustChildControlsCount(this.numberOfDefaultChildren);
	}

	public addEmptyChild(event: MouseEvent): void {
		if (event) {
			event.stopPropagation();
			this.focusNum = this.childControls.length;
		}			
		this.childControls.push(this.initializeChildFormGroup(''));
		this.detectChanges();
		if (event)
			this.childChange.emit(this.focusNum);
	}

	public addChild(value: string): void {
		const firstEmptyChildControl = this.firstEmptyChildControl();
		if (firstEmptyChildControl) {
			firstEmptyChildControl.patchValue({ value: value });
		} else {
			this.childControls.push(this.initializeChildFormGroup(value));
		}
		this.detectChanges();
	}

	public deleteChildControl(i: number) {
		this.childControls.removeAt(i);
		this.addDefaultchildControls();
		this.detectChanges();
	}

	public onChildDelete(event: MouseEvent, index: number) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.deleteChildControl(index);
		this.childDelete.emit(index);
	}

	public detectChanges(): void {
		this._changeDetector.detectChanges();
	}

	public initializeChildFormGroup(value: string): FormGroup {
		return this._formBuilder.group({
			value: [value],
			children: [[]]
		});
	}

	public childValueAt(index: number) {
		return this.childControls.value[index].value;
	}

	public firstEmptyChildControl(): FormControl {
		return <FormControl>this.childControls.controls.find((c: ChildForm) => c.controls.value.value === '');
	}

	public onChildKeyUp(childIndex: number, event: KeyboardEvent = null): void {
		if (event) {
			if ([16].indexOf(event.keyCode) >=0 )
				return;
			if (this.hasRoot && this.form.value['root'] == '' && [8, 46].indexOf(event.keyCode) < 0) {
				this.openWarning();
				this.childControls.controls[childIndex].patchValue({value: ''});
				this.detectChanges();
				return;
			}
		}

		const value = this.childControls.controls[childIndex].value['value'];
		const temp = this.childControls.controls.findIndex((ch, index) =>ch.value.value == value && index != childIndex);

		if (temp >= 0) {
			(this.childControls.controls[childIndex] as FormGroup).controls['value'].setErrors({'incorrect': true});
			this.detectChanges();
			return;
		} else {
			(this.childControls.controls[childIndex] as FormGroup).controls['value'].setErrors(null);
			this.detectChanges();
		}

		// const firstEmptyIndex = this.firstEmptyChildControlIndexBefore(childIndex);
		// this.moveChildControl(childIndex, firstEmptyIndex);
		// if (this.childControls.value[firstEmptyIndex].value !== '') {
		// 	//this.deleteEmptyChildControls();
		// }

		// if (this.jsonFlag) {
		// 	this.childJsonChange.emit({ i: firstEmptyIndex, data: this.childControls.value[firstEmptyIndex].value });
		// }
		// else {
		// 	this.childChange.emit(firstEmptyIndex);
		// }
		this.childChange.emit(childIndex);
	}

	public opendedWarning: boolean = false;

	public openWarning() {
		const attentionWindow = createAttentionDialogWindow(
			this._windowService,
			new AttentionInfo(
				{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'Enter Option name then Details.', font_size: '14px', color: '#8c8c8c' }
				],
				true,
				['OK'],
				''
			));
        attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			this.opendedWarning = false;
            attentionWindow.destroy();
		});
		
		if (!this.opendedWarning) {
			this.opendedWarning = true;
		}
        attentionWindow.open();
	}

	public firstEmptyChildControlIndexBefore(childIndex: number) {
		const foundIndex = this.childControls.value.findIndex((c: ExpandableChildValue) => c.value === '');
		if (foundIndex !== -1 && foundIndex < childIndex) {
		return foundIndex;
		}
		return childIndex;
	}

	public moveChildControl(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) {
			return;
		}
		const value = this.childControls.at(fromIndex).value.value;
		this.childControls.at(toIndex).patchValue({ value: value });
		this.childControls.at(fromIndex).patchValue({ value: '' });
	}

	public deleteEmptyChildControls() {
		const emptyControlsCount = this.childControls.controls
			.filter((c: FormGroup, index: number) => {
			return c.value.value === '' && index >= this.numberOfDefaultChildren;
			}).length;
		if (emptyControlsCount === 0) {
			return;
		}
		const totalControlsCount = this.childControls.controls.length;
		const initialIndex = totalControlsCount - emptyControlsCount;

		for (let i = initialIndex; i < totalControlsCount; i++) {
		this.childControls.removeAt(this.childControls.length - 1);
		}
	}
}
