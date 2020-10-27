import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as omitDeep from 'omit-deep-lodash';
import { ScheduleInfo, LocationInfo, ServiceInfo } from '@app/models';
import * as formLib from '@app-lib/functions/form';
import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
	moduleId: module.id,
	selector: 'services',
	templateUrl: './services.component.html',
	styleUrls: ['./services.component.css'] 
})
export class ServicesComponent implements OnInit, OnDestroy {
		
	@Input() info: ScheduleInfo = new ScheduleInfo; 
	@Input() isNew: boolean = true;
	@Input() visited: boolean = false;
	@ViewChild('formContainer') formContainerEle: ElementRef;

	@Output() infoChange = new EventEmitter<ScheduleInfo>();
	@Output() validityChange = new EventEmitter<boolean>();

	locations: LocationInfo[] = [];
	viewInited: boolean = false;
	activeIndex: number = 0;
	dispForms: any;
	formArray: FormArray;
	hrs: number[] = [0, 1, 2, 3, 4];
	mins: number[] = [0, 15, 30, 45];   

	showLocationValue = (l: LocationInfo) => l.address1;
	showServiceValue = (s: ServiceInfo) => s.title;

	activeServices: ServiceInfo[] = [];

	private fields = ['title', 'description', 'keywords'];
	private animationLeft = [
		{ transform: 'translateX(-50%)' },
		{ transform: 'translateX(0)' }
	];
	private animationRight = [
		{ transform: 'translateX(50%)' },
		{ transform: 'translateX(0)' }
	];
	animationState: string = 'right';
	private subs: Rx.Subscription[] = [];

	constructor(
		private formBuilder: FormBuilder,
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService,
		private appService: AppService
	) {
	}

	ngOnInit() {
		if (this.info.locations && this.info.locations.length > 0) {
			this.locations = this.info.locations.filter(i=>i.editStatus != 'Deleted');
		}
		
		if (this.info.services && this.info.services.length > 0)
			this.formArray = this.formBuilder.array(this.info.services.map(item=>this.newForm(false, item, this.visited)));
		else
			this.formArray = this.formBuilder.array([this.newForm(true, new ServiceInfo, this.visited)]);

		this.subs = [
			this.formArray.valueChanges.subscribe(res => {
				this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');
				this.info.services = res;		
				this.isValid();
			})
		];

		this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');
		if (this.dispForms.length==0) {
			this.activeIndex--;
			this.addForm();
		}

		this.viewInited = true;
		this.isValid();
	}   

	isValid() {
		if (!this.viewInited) return;
		// this.validityChange.emit(this.dispForms.filter((f, index) =>f.valid).length > 0);
		this.validityChange.emit(this.dispForms.findIndex(f=>f.invalid)<0);
		if (this.dispForms.length > 0) {
			this.changeDetector.detectChanges();
		}
	}

	setAnimation() {
		if (this.formContainerEle)
			this.formContainerEle.nativeElement.animate(
				this.animationState == 'left' ? this.animationLeft : this.animationRight,
				{
					duration: 300
				}
			);
	}

	getTagInput(keys: string[]) {		
		return keys.length > 0 ? keys.toString() : '';
	}

	getHours(time: number) {
		return Math.floor(time / 60);
	}

	getMinutes(time: number) {
		return time % 60;
	}

	newForm(isNew: boolean, info: ServiceInfo = new ServiceInfo, markAsTouched: boolean = false) {
		if (isNew && this.info.locations)
			info.locations = this.info.locations.map(location=>location.uid);
		info.locations = info.locations.filter((value, index, self) => self.indexOf(value) === index);
		
		let editStatus = info.editStatus;
		if (!this.isNew && editStatus != 'Deleted' && editStatus != 'New') {
			editStatus = isNew ? 'New' : 'Modified';
		}

		let form = this.formBuilder.group({
			uid	 : [!!info.uid ? info.uid : UUID.UUID(), Validators.required],
			title	   : [info.title, Validators.required],
			description   : [info.description],
			keywords	  : [info.keywords, Validators.required],
			duration	  : [info.duration],
			customerLimit : [info.customerLimit, Validators.required], // 0: No, more than 0 : Yes
			showService   : ['' + info.showService], // 0: Hide, 1: Now, 2: Schedule
			activeDate  : [info.activeDate, Validators.required],
			price	   : [info.price],
			itemCode	  : [info.itemCode], // price: 0 || itemCode: '' then No, or not : Yes
			locations	: [info.locations], // [] : No, or not : Yes
			
			durationCtrl: [info.duration == 0 ? '0' : '1'],
			customerLimitCtrl: [info.customerLimit == 0 ? '0' : '1'],		 
			priceCtrl: [info.price == 0 || info.itemCode == '' ? '0' : '1'],
			locationsCtrl: [!this.info.locations || info.locations.length == this.info.locations.length ? '1' : '0'],
			editStatus  : [editStatus]
		});

		if (markAsTouched) {   
			Object.keys(form.controls).forEach(key=> {
				form.controls[key].markAsTouched();
			})
		}
		return form;
	}

	addForm() {	
		this.activeIndex++;
		this.animationState = 'right';
		this.formArray.push(this.newForm(true));
	}

	removeForm(event: MouseEvent = null) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		if (this.dispForms.length == 1) {
			this.activeIndex--;
			this.addForm();
			if (this.dispForms[this.activeIndex].value['editStatus'] == 'Modified') {				
				(this.dispForms[this.activeIndex] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
			else {		
				this.formArray.removeAt(this.formArray.length - 2);
			}		 
			return;
		}

		if (this.activeIndex >= this.dispForms.length-1) {
			if (this.isNew === true) {			
				let index = this.formArray.controls.findIndex(control => control === this.dispForms[this.activeIndex]);
				this.animationState = 'left';
				this.activeIndex --;			
				this.formArray.removeAt(index);
			}
			else {
				this.activeIndex --;
				(this.dispForms[this.activeIndex+1] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
		}
		else {
			this.animationState = 'right';
			if (this.isNew === true) {
				let index = this.formArray.controls.findIndex(control => control === this.dispForms[this.activeIndex]);
				this.formArray.removeAt(index);
			}
			else {
				(this.dispForms[this.activeIndex] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
		}
		this.setAnimation();
	}

	prev(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (this.dispForms[this.activeIndex].invalid) {
			if (this.isBlankForm()) {
				this.removeForm();
			}
			else {
				this.alertService.playToast('Warning', 'Please fill in the required fields or delete this form.',2);
			}		 
			return;
		}
		if (this.activeIndex > 0) {
			this.animationState = 'left';
			this.activeIndex--;
			this.changeDetector.detectChanges();
			this.setAnimation();
		}	  
	}

	next(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();	
		if (this.dispForms[this.activeIndex].invalid) {
			this.alertService.playToast('Warning', 'Please fill in the required fields.',2);
			return;
		}
		if (this.activeIndex < this.dispForms.length - 1) {	  
			this.animationState = 'right';
			this.activeIndex++;
			this.changeDetector.detectChanges();		
		}
		else {
			this.addForm();
		}
		this.setAnimation();
	}

	isBlankForm() {
		return formLib.isBlankFrom(this.dispForms[this.activeIndex], this.newForm(true), this.fields);
	}

	onSetKeywords(event: string) {
		let keywords = event.split(',');
		if (keywords.length == 1 && keywords[0] == '')
			keywords = [];
		(this.dispForms[this.activeIndex] as FormGroup).controls['keywords'].setValue(keywords);
	}

	onHrChange(event: any) {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['duration'];
		let mins = this.getMinutes(control.value);
		control.setValue(parseInt(event) * 60 + mins);
	}

	onMinChange(event: any) {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['duration'];
		let hrs = this.getHours(control.value);  
		control.setValue(hrs * 60 + parseInt(event));
	}

	getSelectedFirstLocation() {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['locations'];
		if (control.value && control.value.length > 0) {
			let res = this.getLocations([control.value[0]]);
			return res[0]
		}
		return null;
	}

	getSelectedLocations() {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['locations'];
		return this.getLocations(control.value);
	}

	isLocationChecked(form, uid) {	  
		if (!form.controls['locations'].value) return false;
		return form.controls['locations'].value.indexOf(uid) >= 0;
	}

	onLocationCtrlChange(event, form) {
		if (form.controls['locationsCtrl'].value == 1 && this.info.locations) {
			form.controls['locations'].setValue(this.info.locations.map(location=>location.uid));
		}
		else if (form.controls['locationsCtrl'].value == 0  && this.info.locations) {
			form.controls['locations'].setValue([]);
		}	  
	}

	onLocationsChange(event, form, uid) {
		let control = form.controls['locations'];
		let locationUids = control.value ? control.value : [];
		if (event.target.checked) {
			if (!locationUids || locationUids.length == 0) {
				locationUids.push(uid);
			}
			else if (locationUids.indexOf(uid) < 0) {
				locationUids.push(uid);
			} 
		}
		else {
			locationUids = locationUids.filter(luid=>luid!=uid);
		}
		control.setValue(locationUids);
	}   
		
	getLocations(uids: string[]) {
		let locations = (this.info.locations || []).filter(l=>uids.indexOf(l.uid)>=0);
		return locations
	}   
		
	generateCode(length: number = 6) {
		let output = '';
		const choices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		for (let i = 0; i < 4; i++) {
		  output += choices.charAt(Math.floor(Math.random() * choices.length));
		}
		output += '-000';
		(this.dispForms[this.activeIndex] as FormGroup).controls['itemCode'].setValue(output);	
	}

	ngOnDestroy() {
		this.viewInited = false;
		if (this.formArray.controls[this.formArray.controls.length - 1].invalid && !this.formArray.controls[this.formArray.controls.length - 1].dirty && ['New', 'NoChange'].indexOf(this.formArray.controls[this.formArray.controls.length - 1].value['editStatus'])>=0 && this.info.services) {
			this.info.services.splice(this.info.services.length -1);		
			this.validityChange.emit(this.info.services.length > 0 && this.dispForms.findIndex((f, index) =>f.invalid && index < this.dispForms.length -1 )<0);
		}	  
		if (this.info.services && this.info.providers && this.info.providerType == 'SingleProviderDisplay') {			
			let newServices = this.info.services.filter(service=>this.info.providers[0].services.indexOf(service.uid) < 0);   
			newServices.forEach(service=> {	
				this.info.providers[0].services.push(service.uid);
			})
		}
		this.subs.forEach(s => s.unsubscribe());
	}   
}
