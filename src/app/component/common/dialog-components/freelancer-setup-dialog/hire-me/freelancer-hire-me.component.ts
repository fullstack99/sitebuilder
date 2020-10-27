import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as moment from 'moment';
import { User, FreelancerHireInfo } from '@app/models';
import { AlertService } from '@app/services';

@Component({
	moduleId: module.id,
	selector: 'freelancer-hire-me',
	templateUrl: './freelancer-hire-me.component.html',
	styleUrls: ['./freelancer-hire-me.component.css']
})
export class FreelancerHireMeComponent implements OnInit, OnChanges, OnDestroy {
		
	@Input() info: User = new User;	
	@Input() isNew: boolean = true;

	@Output() infoChange = new EventEmitter<User>();
	@Output() validityChange = new EventEmitter<boolean>();

	viewInited: boolean = false;
	form: FormGroup;

	private subs: Rx.Subscription[] = [];

	constructor(
		private formBuilder: FormBuilder,
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService
	) {
	}

	ngOnInit() {
		this.form = this.formBuilder.group({
			priceType	 : ['1'],
			projectType   : ['1'],
			hourlyRate	: [this.info.hourlyRate, Validators.required],
			minimum	   : [this.info.minimum, Validators.required],
			price		 : ['', Validators.required],
			request	   : ['', Validators.required],
			startDate	 : [new Date(), Validators.required]
		});

		this.subs = [
			this.form.valueChanges.subscribe(res => {
				this.info.hourlyRate = res['hourlyRate'];
				this.info.minimum = res['minimum'];
				this.validityChange.emit(this.info.hourlyRate > 0 && this.info.minimum > 0);
				this.isValid();
			})			
		];
		this.viewInited = true;
		this.isValid();
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	isValid() {		
		if (!this.viewInited) return;		
		this.changeDetector.detectChanges();
	}

	onSubmit(event) {
		
	}

	ngOnDestroy() {
		this.viewInited = false;		
		this.subs.forEach(s => s.unsubscribe());
	}   
}
