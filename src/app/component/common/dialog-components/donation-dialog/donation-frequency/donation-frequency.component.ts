import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
	OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges
	} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { FrequencyTypes } from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'fundraising-donation-frequency',
	templateUrl: './donation-frequency.component.html',
	styleUrls: [
		'./donation-frequency.component.css',
		'../donation-dialog.component.css'
	]
})

export class DonationFrequencyComponent implements OnInit, OnDestroy{
	
	@Input('fundraisingFrequencyEnabled') fundraisingFrequencyEnabled = new FormControl(false);
	@Input('fundraisingFrequencyType') fundraisingFrequencyType = new FormControl('OneTime');

	@ViewChild('box') box: ElementRef;

	frequencyTypes = FrequencyTypes;
	_subs: Rx.Subscription[] = [];

	ngOnInit() {

		if (this.fundraisingFrequencyEnabled.value)
			$(this.box.nativeElement).slideDown("fast");
		else
			$(this.box.nativeElement).slideUp("fast");

		this._subs=[
			this.fundraisingFrequencyEnabled.valueChanges.subscribe(value=> {
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
