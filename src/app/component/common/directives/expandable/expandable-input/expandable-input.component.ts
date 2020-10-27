import { Component, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ExpandableComponent } from '@app-directives/expandable/expandable.component';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'expandable-input',
	templateUrl: './expandable-input.component.html',
	styleUrls: [
		'../expandable.component.css',
		'./expandable-input.component.css'
	]
})
export class ExpandableInputComponent extends ExpandableComponent  {
	@Input() children: Array<any>;
	@Input() itemTitle: string;
	@Input() numberOfDefaultChildren = 0;
	@Input() rootName: string;
	@Input() useSplitBoxForRoot: boolean;
	@Input() jsonFlag?: boolean;
	@Input() isFocused: boolean = false;
	@Input() error: boolean = false;

	@Output() rootChange = new EventEmitter<string>();
	@Output() childChange = new EventEmitter<number>();
	@Output() childDelete = new EventEmitter<number>();
	@Output() childJsonChange = new EventEmitter<{}>();

	constructor(protected _changeDetector: ChangeDetectorRef,
				protected _formBuilder: FormBuilder,
				protected _windowService: WindowService) {
		super(_changeDetector, _formBuilder, _windowService);
	}

	public ngOnInit(): void {
		super.ngOnInit();
	}
}
