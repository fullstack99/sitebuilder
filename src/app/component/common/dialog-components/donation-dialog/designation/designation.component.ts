import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
	OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef
	} from '@angular/core';
import { FormControl, Validators, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { ExpandableChildValue } from '@app-directives/expandable/expandable-values';

@Component({
	moduleId: module.id,
	selector: 'fundraising-designation',
	templateUrl: './designation.component.html',
	styleUrls: [
		'./designation.component.css',
		'../donation-dialog.component.css'
	]
})

export class DesignationComponent implements OnInit, OnDestroy {

	@Input('programDesignationsEnabled') programDesignationsEnabled = new FormControl(false);
	@Input('programDesignations') programDesignations: FormControl;
	@ViewChild('box') box: ElementRef;

	selected: string = '';	
	expandable_elements: ExpandableChildValue[];

	_subs: Rx.Subscription[] = [];

	constructor(        
        private changeDetector: ChangeDetectorRef,
    ) {        
    }

	ngOnInit() {		
		this.expandable_elements = [];		
		
		this.programDesignations.value.map(form=> {			
			this.expandable_elements.push({value:form,children: []});
		});

		if (this.programDesignationsEnabled.value)
			$(this.box.nativeElement).slideDown("fast");
		else
			$(this.box.nativeElement).slideUp("fast");
		
		this._subs=[
			this.programDesignationsEnabled.valueChanges.subscribe(value=> {
				if (value)
					$(this.box.nativeElement).slideDown("slow");
				else
					$(this.box.nativeElement).slideUp("slow");
			})
		];
	}
	
	changeSelected(event: any) {
		this.selected = event;
	}
	
	rootChange(event: any) {
		//console.log(event);
	}

	childChange(event: any) {		
		if (event.i > this.programDesignations.value.length - 1) {			
			this.programDesignations.setValue([...this.programDesignations.value, event.data]);			
		}
		else {			
			this.programDesignations.value[event.i] = event.data;			
		}
		this.changeDetector.detectChanges();
	}

	childDelete(event: any) {
		this.programDesignations.setValue(this.programDesignations.value.filter((v,i) =>i!=event));
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}
