import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
	OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges
	} from '@angular/core';
import {
		FormBuilder, FormGroup, FormControl, Validators, AbstractControl, 
	} from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { DedicationInfo } from '@app/models'

export interface DedicationForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;		
		sendEmailAcknowledgment: FormControl;		
	};
}

export function newDedicationForm(v: DedicationInfo): DedicationForm {
	return <DedicationForm>new FormGroup({		
		sendEmailAcknowledgment: new FormControl(v.sendEmailAcknowledgment)
	});
}

@Component({
	moduleId: module.id,
	selector: 'fundraising-dedication',
	templateUrl: './dedication.component.html',
	styleUrls: [		
		'./dedication.component.css',
		'../donation-dialog.component.css'
	]
})

export class DedicationComponent implements OnInit, OnDestroy {

	@Input('dedicationEnabled') dedicationEnabled = new FormControl(false);
	@Input('form') form: DedicationForm;
	
	@ViewChild('box') box: ElementRef;

	types = [
		{ type: 'behalf', disp: 'on behalf of' },
		{ type: 'honor', disp: 'in honor of' },
		{ type: 'memory', disp: 'in memory of' }
	];
	
	_subs: Rx.Subscription[] = [];

	ngOnInit() {		
		
		if (this.dedicationEnabled.value)
			$(this.box.nativeElement).slideDown("fast");
		else
			$(this.box.nativeElement).slideUp("fast");
		
		this._subs=[
			this.dedicationEnabled.valueChanges.subscribe(value=> {
				if (value)
					$(this.box.nativeElement).slideDown("slow");
				else
					$(this.box.nativeElement).slideUp("slow");
			})
		];

	}
	
	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}
