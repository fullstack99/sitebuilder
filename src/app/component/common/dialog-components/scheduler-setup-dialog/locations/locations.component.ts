import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { matchEmail, emailValidator } from '@app-lib/validators/form-validator';
import { ScheduleInfo, LocationInfo, ProviderLocationInfo } from '@app/models';
import * as formLib from '@app-lib/functions/form';
import { AlertService } from '@app/services';

@Component({
    moduleId: module.id,
    selector: 'locations',
    templateUrl: './locations.component.html',
    styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() info: ScheduleInfo = new ScheduleInfo;   
    @Input() isNew: boolean = true;
    @Input() visited: boolean = false;
    @ViewChild('formContainer') formContainerEle: ElementRef;

    @Output() infoChange = new EventEmitter<ScheduleInfo>();
    @Output() validityChange = new EventEmitter<boolean>();
    @Output() locationTypeChange = new EventEmitter<boolean>();

    viewInited: boolean = false;
    activeIndex: number = 0;
    dispForms: any;
    companyNameCtrl: FormControl = new FormControl('', [Validators.required]);
    locationTypeCtrl: FormControl = new FormControl('-1');
    formArray: FormArray;   
    animationState: string = 'right';
    private animationLeft = [
        { transform: 'translateX(-50%)' },
        { transform: 'translateX(0)' }
    ];
    private animationRight = [
        { transform: 'translateX(50%)' },
        { transform: 'translateX(0)' }
    ];
    private fields = ['address1', 'address2', 'city', 'province', 'postalCode', 'phone', 'email'];
    private locationTypes = ['CustomerComesToUs', 'WeGoToCustomerLocation'];
    private subs: Rx.Subscription[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private changeDetector: ChangeDetectorRef,
        private alertService: AlertService
    ) {
    }

    ngOnInit() {
        this.locationTypeCtrl.setValue('' + this.locationTypes.indexOf(this.info.locationType), {emitEvent: false});
        this.companyNameCtrl.setValue(this.info.companyName);
        
        if (this.info.locations && this.info.locations.length > 0)
            this.formArray = this.formBuilder.array(this.info.locations.map(item => this.newForm(false, item, this.info.locationType == 'WeGoToCustomerLocation' ? false : this.visited)));
        else
            this.formArray = this.formBuilder.array([this.newForm(true, new LocationInfo, this.info.locationType == 'WeGoToCustomerLocation' ? false : this.visited)]);        

        this.subs = [
            this.companyNameCtrl.valueChanges.subscribe(res => {
                this.info.companyName = ('' + res).trim();
                this.isValid();
            }), 
            this.locationTypeCtrl.valueChanges.subscribe(res => {
                this.info.locationType = this.locationTypes[parseInt(res)];
                if (this.info.providers && this.info.locations) {
                    if (res == '0') {                        
                        this.info.providers.forEach(p=> {
                            if (this.isNew) {
                                p.locations = this.info.locations.map(l=>new ProviderLocationInfo(l.uid, l.hoursOfOperation));
                            }                                
                            else {
                                p.locations = this.info.locations.map(l=> {
                                    let hOp = lodash.cloneDeep(l.hoursOfOperation);
                                    hOp.editStatus = 'New';
                                    return new ProviderLocationInfo(l.uid, hOp);
                                });
                            }
                        })
                    }                        
                    else if (res == '1') {
                        this.info.providers.forEach(p=> {
                            if (this.isNew)
                                p.locations = [];
                            else {
                                p.locations = [];
                            }
                        })
                    }
                }                
                this.isValid();
            }),

            this.formArray.valueChanges.subscribe(res => {
                this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');                
                this.info.locations = res;
                this.isValid();                
            })
        ];

        this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');
        if (this.dispForms.length==0) {
            this.activeIndex--;
            this.addForm();
        }        
    }

    ngAfterViewInit() {
        this.viewInited = true;
        this.isValid();
    }

    isValid() {        
        if (!this.viewInited) return;        
        if (this.dispForms.length > 0) {
            this.changeDetector.detectChanges();
        }
        this.validityChange.emit(this.info.companyName.trim() != '' && (this.dispForms.findIndex(f=>f.invalid)<0 || this.locationTypeCtrl.value == '1'));        
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

    newForm(isNew: boolean, info: LocationInfo = new LocationInfo, markAsTouched: boolean = false) {

        let editStatus = info.editStatus;
        if (!this.isNew && editStatus != 'Deleted' && editStatus != 'New') {
            editStatus = isNew ? 'New' : 'Modified';
            if (info.hoursOfOperation && !info.hoursOfOperation.times.sunday) {
                info.hoursOfOperation.times['sunday'] = [];
            }
        }        

        let form = this.formBuilder.group({
            id          : [info.id],
            uid         : [info.uid],
            address1    : [info.address1, Validators.required],
            address2    : [info.address2],
            city        : [info.city, Validators.required],
            province    : [info.province, Validators.required],
            postalCode  : [info.postalCode, Validators.required],
            phone       : [info.phone, Validators.required],
            email       : [info.email, { updateOn: 'blur', validators: [ Validators.required, emailValidator ] }],
            hoursOfOperation : [info.hoursOfOperation],
            editStatus  : [editStatus],
            willHoursChange : [isNew || info.willHoursChange ? true : false]
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
        this.alertService.playToast('Warning', 'You need to add Providers hours after fill up!', 2);
    }

    removeForm(event: MouseEvent = null) {
        if (this.locationTypeCtrl.value == '1') return;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.info.services.forEach(service=> {
            service.locations = service.locations.filter(l=>l != this.dispForms[this.activeIndex].value['uid']);
        });

        this.info.providers.forEach(provider=> {
            provider.locations = provider.locations.filter(l=>l.locationUid != this.dispForms[this.activeIndex].value['uid']);            
        })

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
            this.activeIndex--;
            this.animationState = 'left';
            this.changeDetector.detectChanges();
            this.setAnimation();
        }
    }

    next(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();        
        if (this.dispForms[this.activeIndex].invalid) {
            this.alertService.playToast('Warning', 'Please fill in the required fields.', 2);
            return;
        }
        if (this.activeIndex < this.dispForms.length - 1) {
            this.activeIndex++;
            this.animationState = 'right';
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

    ngOnDestroy() {
        this.viewInited = false;        
        if (this.formArray.controls[this.formArray.controls.length - 1].invalid && !this.formArray.controls[this.formArray.controls.length - 1].dirty && ['New', 'NoChange'].indexOf(this.formArray.controls[this.formArray.controls.length - 1].value['editStatus'])>=0 && this.info.locations) {
            this.info.locations.splice(this.info.locations.length -1);            
            if (this.info.locationType == 'CustomerComesToUs')
                this.validityChange.emit(this.info.locations.length > 0 && this.dispForms.findIndex((f, index) =>f.invalid && index < this.dispForms.length -1 )<0);
        }
        
        if (this.info.locations && this.info.providers && this.info.providerType == 'SingleProviderDisplay') {
            let locationUids = this.info.providers[0].locations.map(location=>location.locationUid);
            let newLocations = this.info.locations.filter(location=>locationUids.indexOf(location.uid) < 0);            
            newLocations.forEach(location=> {
                let hOp = lodash.cloneDeep(location.hoursOfOperation);
                hOp.editStatus = 'New';
                this.info.providers[0].locations.push(new ProviderLocationInfo(location.uid, hOp));                
            })
        }
        this.subs.forEach(s => s.unsubscribe());
    }   
}
