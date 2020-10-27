import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';

import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { ScheduleInfo, LocationInfo, ProviderInfo, HourInfo, ServiceTimeInfo, AttentionInfo } from '@app/models';
import { AlertService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';

@Component({
    moduleId: module.id,
    selector: 'hours',
    templateUrl: './hours.component.html',
    styleUrls: ['./hours.component.css']
})
export class HoursComponent implements OnInit, OnDestroy {

    @Input() info: ScheduleInfo = new ScheduleInfo;
    @Input() isNew: boolean = true;
    @Input() visited: boolean = false;
    
    @Output() infoChange = new EventEmitter<ScheduleInfo>();
    @Output() validityChange = new EventEmitter<boolean>();   
    
    scheduleTypeCtrl: FormControl = new FormControl('ExactTime');
    hourTypeCtrl: FormControl = new FormControl(-1);
    sameCheck: FormControl = new FormControl(false);

    isVisibleDropdown: boolean = false;    
    locations: LocationInfo[] = [];
    providers: ProviderInfo[] = [];
    selectedLocations: LocationInfo[] = [];
    selectedProviders: ProviderInfo[] = [];

    showLocationValue = (l: LocationInfo | string) => typeof l != 'object' ? l : l.address1;
	showProviderValue = (p: ProviderInfo | string) => typeof p != 'object' ? p : p.name;
    
    etimes: string[] = ['Every 15min','Every 30min','Every 45min', 'Every 60min', 'Every 75min', 'Every 90min', 'Every 105min', 'Every 120min'];
    btimes: string[] = ['Between 1hr', 'Between 2hrs', 'Between 3hrs', 'Between 4hrs'];
    days: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    hourInfo: HourInfo = new HourInfo;
    viewInited: boolean = false;
    timeRefresh = new Rx.Subject<number>();

    private dragEle: HTMLElement;
    private subs: Rx.Subscription[] = [];

    constructor(        
        private changeDetector: ChangeDetectorRef,
        private alertService: AlertService,
        private windowService: WindowService
    ) {}

    ngOnInit() {        
        this.scheduleTypeCtrl.setValue('' + this.info.scheduleType);

        this.hourInfo = this.info.hoursOfOperation;        
        if (this.info.locations && this.info.locations.length > 0) {
            this.locations = this.info.locations.filter(i=>i.editStatus != 'Deleted');            
            if (this.locations.length > 0) {                
                if (this.locations[0].hoursOfOperation && this.locations.findIndex(l=>l.uid != this.locations[0].uid && l.hoursOfOperation && differenceDeep.isDifference(this.locations[0].hoursOfOperation.times, l.hoursOfOperation.times)) < 0) {
                    this.selectedLocations = this.locations;
                }
                else {
                    this.selectedLocations = [this.locations[0]];
                }
            }            
        }

        if (this.info.providers && this.info.providers.length > 0) {
            this.providers = this.info.providers.filter(i=>i.editStatus != 'Deleted');
            if (this.providers.length>0) {                
                if (this.providers[0].hoursOfOperation && this.providers.findIndex(p=>p.uid != this.providers[0].uid && p.hoursOfOperation && differenceDeep.isDifference(this.providers[0].hoursOfOperation.times, p.hoursOfOperation.times)) < 0) {
                    this.selectedProviders = this.providers;
                }
                else {
                    this.selectedProviders = [this.providers[0]];
                }
            }            
        }       

        this.subs = [
            this.scheduleTypeCtrl.valueChanges.subscribe(res => {
                if (res=='BlocksOfTime')
                    this.info.scheduleTimes = 1;
                else
                    this.info.scheduleTimes = 30;
                this.info.scheduleType = res;
                this.isValid();
            }),

            this.hourTypeCtrl.valueChanges.subscribe(res => {
                this.isVisibleDropdown = (res==0 && this.info.locationType != 'WeGoToCustomerLocation' && this.locations && this.locations.length > 1 || res==1 && ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) < 0 && this.providers && this.providers.length > 1);                
                this.initHourInfo(res);                
            })       
        ];

        this.viewInited = true;       
        
        // if (this.isVisibleSameHoursBoth) {
        //     this.locations[0].willHoursChange = false;
        //     this.isValid();
        // }
        if (this.info.locationType == 'WeGoToCustomerLocation' && ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) < 0) {
            this.hourTypeCtrl.setValue(1);
        }
        else {
            this.hourTypeCtrl.setValue(0);
        }
        // this.alertService.playToast('Warning', 'Please make sure hours.', 2);
    }

    get isVisibleSameHoursBoth(): boolean {
        if (!this.isVisibleLocationOption) return false;
        if (this.locations.length > 1 || this.providers.length > 1) return false;
        if (this.providers.length == 1 && differenceDeep.isDifference(this.providers[0].hoursOfOperation, this.locations[0].hoursOfOperation)) return false;
        if (differenceDeep.isDifference(this.hourInfo, this.locations[0].hoursOfOperation)) return false;        
        return true;
    }

    get isVisibleLocationOption(): boolean {
        return this.info.locationType != 'WeGoToCustomerLocation' && this.locations && this.locations.length > 0;        
    }   

    get visibleSameCheck() {
        // if (this.hourTypeCtrl.value == 0 && this.info.locationType != 'WeGoToCustomerLocation' && this.locations.length > 1) return true;
        // if (this.hourTypeCtrl.value == 1 && ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) >= 0) return true;
        return false;
    }

    initHourInfo(event: number) {
        this.hourInfo = null;

        if (this.info.locationType == 'WeGoToCustomerLocation') {
            this.hourInfo = this.info.hoursOfOperation;
            if (this.selectedProviders && this.selectedProviders.length > 0) {
                this.selectedProviders.forEach(p=> {
                    p.willHoursChange = false;
                });                
            }
        }
        else if (event==0 && this.locations && this.locations.length > 0) {
            if (this.selectedLocations && this.selectedLocations.length > 0) {
                this.selectedLocations.forEach(l=> {
                    l.willHoursChange = false;
                })
                this.hourInfo = this.selectedLocations[0].hoursOfOperation;
            }            
        }
        else if (event==1 && this.providers && this.providers.length > 0) {
            if (this.selectedProviders && this.selectedProviders.length > 0) {
                this.selectedProviders.forEach(p=> {
                    p.willHoursChange = false;
                });
                this.hourInfo = this.selectedProviders[0].hoursOfOperation;
            }
        }

        if (!this.hourInfo)
            this.hourInfo = this.info.hoursOfOperation;
        this.isValid(true);        
    }

    isValid(init: boolean = false) {
        if (!this.viewInited) return;
        if (!this.isNew)
            this.info.hoursOfOperation.editStatus = 'Modified';

        let r: any = [];
        if (this.info.locationType == 'CustomerComesToUs' && this.info.locations) {
            r = this.info.locations.filter(l=>l.willHoursChange);
        }
        if (r.length == 0 && this.info.providers) {
            r = this.info.providers.filter(p=>p.willHoursChange);
        }
        this.validityChange.emit(r.length == 0);
        if (!init)
            this.changeDetector.detectChanges();
    }    
    
    getDefaultData() {
        return this.hourTypeCtrl.value == 0 ? 'Choose Locations' : 'Choose Providers';
    }

    getDefaultSelecteAllData() {
        return this.hourTypeCtrl.value == 0 ? 'All Locations Same' : 'All Providers Same';
    }

    getElements() {
        return this.hourTypeCtrl.value == 0 ? this.locations : this.providers;
    }

    getSelectedFirstElement() {
        if (this.hourTypeCtrl.value == 0 && this.selectedLocations && this.selectedLocations.length > 0 && this.selectedLocations.length != this.locations.length) {
            return this.selectedLocations[0];
        }
        else if (this.hourTypeCtrl.value == 1 && this.selectedProviders && this.selectedProviders.length > 0 && this.selectedProviders.length != this.providers.length) {
            return this.selectedProviders[0];
        }
        return null;
    }

    getSelectedElements() {
        return this.hourTypeCtrl.value == 0 ? this.selectedLocations : this.selectedProviders;
    }

    getShowValue() {
        return this.hourTypeCtrl.value == 0 ? this.showLocationValue : this.showProviderValue;
    }    
    
    onDropdownChange(event) {        
        if (this.hourTypeCtrl.value == 0) {
            this.selectedLocations = event;
            if (this.selectedLocations.length > 0) {
                if (this.selectedLocations.length > 1 && this.selectedLocations.findIndex(l=>l.uid != this.selectedLocations[0].uid && differenceDeep.isDifference(this.selectedLocations[0].hoursOfOperation.times, l.hoursOfOperation.times)) >= 0) {
                    let info: AttentionInfo = new AttentionInfo(
                        { value: 'Warning!', font_size: '18px', color: '#8c8c8c' },
                        [
                            { value: 'Selected locations have different hours.', font_size: '16px', color: '#8c8c8c' },
                            { value: 'Do you want to make all the selected items have the same hours?', font_size: '16px', color: '#8c8c8c' }
                        ],
                        true,
                        ['Yes', 'No'],
                        ''
                        );
        
                    let attentionWindow = createAttentionDialogWindow(this.windowService,info);
                    attentionWindow.componentRef.instance.submit.subscribe((res) => {
                        if (res) {
                            this.hourInfo = this.selectedLocations[0].hoursOfOperation;
                            this.selectedLocations.forEach((item, index) => {
                                item.willHoursChange = false;
                                item.hoursOfOperation = lodash.cloneDeep(this.hourInfo);
                            });
                        }
                        else {
                            this.selectedLocations = [this.selectedLocations[this.selectedLocations.length-1]];
                            this.selectedLocations[0].willHoursChange = false;
                            this.hourInfo = this.selectedLocations[0].hoursOfOperation;
                        }
                        this.isValid();
                    })
                    attentionWindow.open();
                }
                else {
                    this.hourInfo = this.selectedLocations[0].hoursOfOperation;
                    this.selectedLocations[0].willHoursChange = false;
                    this.isValid();
                }                
            }
            else {
                this.hourInfo = this.info.hoursOfOperation;
                this.isValid();
            }            
        }
        else {            
            this.selectedProviders = event;
            if (this.selectedProviders.length > 0) {
                if (this.selectedProviders.length > 1 && this.selectedProviders.findIndex(p=>p.uid != this.selectedProviders[0].uid && differenceDeep.isDifference(this.selectedProviders[0].hoursOfOperation.times, p.hoursOfOperation.times)) >= 0) {
                    let info: AttentionInfo = new AttentionInfo(
                        { value: 'Warning!', font_size: '18px', color: '#8c8c8c' },
                        [
                            { value: 'Selected Providers have different hours.', font_size: '16px', color: '#8c8c8c' },
                            { value: 'Do you want to make all the selected items have the same hours?', font_size: '16px', color: '#8c8c8c' }
                        ],
                        true,
                        ['Yes', 'No'],
                        ''
                        );
        
                    let attentionWindow = createAttentionDialogWindow(this.windowService,info);
                    attentionWindow.componentRef.instance.submit.subscribe((res) => {
                        if (res) {
                            this.hourInfo = this.selectedProviders[0].hoursOfOperation;
                            this.selectedProviders.forEach((item, index) => {
                                item.willHoursChange = false;
                                item.hoursOfOperation = lodash.cloneDeep(this.hourInfo);
                            });
                        }
                        else {
                            this.selectedProviders = [this.selectedProviders[this.selectedProviders.length-1]];
                            this.selectedProviders[0].willHoursChange = false;
                            this.hourInfo = this.selectedProviders[0].hoursOfOperation;
                        }
                        this.isValid();
                    })
                    attentionWindow.open();
                }
                else {
                    this.selectedProviders[0].willHoursChange = false;
                    this.hourInfo = this.selectedProviders[0].hoursOfOperation;                    
                    this.isValid();
                }
            }
            else {                
                this.hourInfo = this.info.hoursOfOperation;
                this.isValid();
            }            
        }        
    }

    getScheduleTime(f: number = 0) { //0 : ExactTime, 1: BlocksOfTime
        return f==1 && this.scheduleTypeCtrl.value == 'BlocksOfTime' ? ('Between ' + this.info.scheduleTimes + (this.info.scheduleTimes == 1 ? 'hr' : 'hrs')) : (f==0 && this.scheduleTypeCtrl.value == 'ExactTime' ? ('Every ' + this.info.scheduleTimes + 'min') : '');
    }

    onHourChange(event: ServiceTimeInfo[], day: string, i: number) {
        // console.log(this.info.locationType != 'WeGoToCustomerLocation', this.info.locations.length > 0, [0,1].indexOf(this.hourTypeCtrl.value) < 0, this.hourTypeCtrl.value)
        if (this.info.locationType == 'WeGoToCustomerLocation' &&  this.providers && this.providers.length == 1) {            
            this.hourInfo.times[day] = event;
            this.providers[0].willHoursChange = false; // provider's hourInfo is changed
            if ((!this.providers[0].editStatus || this.providers[0].editStatus != 'NoChange') && this.providers[0].editStatus != 'Modified') {
                this.providers[0].editStatus = 'Modified';
            }
            if (!this.providers[0].hoursOfOperation) {
                if (this.providers[0].editStatus == 'Modified')
                    this.providers[0].hoursOfOperation.editStatus = 'New';
                else
                    this.providers[0].hoursOfOperation.editStatus = 'NoChange';
            }
            else if ((!this.providers[0].hoursOfOperation.editStatus || this.providers[0].hoursOfOperation.editStatus != 'NoChange') && this.providers[0].hoursOfOperation.editStatus != 'Modified') {
                this.providers[0].hoursOfOperation.editStatus = 'Modified';
            }
            this.providers[0].hoursOfOperation.times[day] = lodash.cloneDeep(event);
        }
        else if (this.info.locationType != 'WeGoToCustomerLocation' && this.locations && this.locations.length > 0 && [0,1].indexOf(this.hourTypeCtrl.value) < 0) {
            this.alertService.playToast('Warning','Choose a location or provider to edit hours', 2);
            this.timeRefresh.next(i);            
            return;
        }        

        if (this.hourTypeCtrl.value == 0) {
            this.hourInfo.times[day] = event;
            this.selectedLocations.forEach(item=> {
                item.willHoursChange = false; // hourInfo of location is changed

                if ((!item.editStatus || item.editStatus != 'NoChange') && item.editStatus != 'Modified') {
                    item.editStatus = 'Modified';
                }
                if ((!item.hoursOfOperation.editStatus || item.hoursOfOperation.editStatus != 'NoChange') && item.hoursOfOperation.editStatus != 'Modified') {
                    item.hoursOfOperation.editStatus = 'Modified';
                }

                item.hoursOfOperation.times[day] = lodash.cloneDeep(event);

                if (!event && event.length == 0 && this.providers) {
                    this.providers.forEach(provider=> {
                        let location = provider.locations.find(p=>p.locationUid == item.uid);
                        if (location) {
                            if (!location.hoursOfOperation.editStatus || location.hoursOfOperation.editStatus != 'NoChange')
                                location.hoursOfOperation.editStatus = 'Modified';
                            location.hoursOfOperation.times[day] = [];
                        }                            
                    });
                }
            });

            if (this.selectedLocations.length == this.locations.length) {
                if ((!this.info.hoursOfOperation.editStatus || this.info.hoursOfOperation.editStatus != 'NoChange') && this.info.hoursOfOperation.editStatus != 'Modified') {
                    this.info.hoursOfOperation.editStatus = 'Modified';
                }
                this.info.hoursOfOperation.times[day] = lodash.cloneDeep(event);
            }

            if (this.sameCheck.value) {
                this.info.hoursOfOperation.times[day] = lodash.cloneDeep(event);
            }
        }
        else if (this.hourTypeCtrl.value == 1) {
            this.hourInfo.times[day] = event;
            this.selectedProviders.forEach(item=> {
                item.willHoursChange = false; // provider's hourInfo is changed
                if ((!item.editStatus || item.editStatus != 'NoChange') && item.editStatus != 'Modified') {
                    item.editStatus = 'Modified';
                }
                if ((!item.hoursOfOperation.editStatus || item.hoursOfOperation.editStatus != 'NoChange') && item.hoursOfOperation.editStatus != 'Modified') {
                    item.hoursOfOperation.editStatus = 'Modified';
                }
                item.hoursOfOperation.times[day] = lodash.cloneDeep(event);
            });

            if (this.sameCheck.value) {
                this.info.hoursOfOperation.times[day] = lodash.cloneDeep(event);
            }
        }
        else {
            if ((!this.info.hoursOfOperation.editStatus || this.info.hoursOfOperation.editStatus != 'NoChange') && this.info.hoursOfOperation.editStatus != 'Modified') {
                this.info.hoursOfOperation.editStatus = 'Modified';
            }
            this.info.hoursOfOperation.times[day] = event;
        }
        this.isValid();
    }

    onETimesChange(event: string) {
        if (this.scheduleTypeCtrl.value == 'ExactTime') {
            this.info.scheduleTimes = 15 + 15 * this.etimes.findIndex(etime => etime == event);
            this.isValid();
        }        
    }

    onBTimesChange(event: string) {
        if (this.scheduleTypeCtrl.value == 'BlocksOfTime') {
            this.info.scheduleTimes = 1 + 1 * this.btimes.findIndex(btime => btime == event);
            this.isValid();
        }        
    }

    getDefaultHourData() {
        if (['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) >= 0 && this.info.locationType == 'WeGoToCustomerLocation') {
            return 'Blocked';
        }
        else if (this.hourTypeCtrl.value == 0) {
            return 'Closed';
        }
        else {
            return 'Blocked';
        }
    }

    isVisibleDateTimeList() {        
        if (['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) >= 0 || this.info.locationType == 'WeGoToCustomerLocation')
            return true;
        else if (this.info.locationType != 'WeGoToCustomerLocation') {
            if (this.hourTypeCtrl.value == 0 && this.selectedLocations.length > 0 || this.hourTypeCtrl.value == 1 && this.selectedProviders.length > 0)
                return true;
        }
        return false;
    }
    
    refreshView() {
        if (this.viewInited)
            this.changeDetector.detectChanges();
    }
    
    ngOnDestroy() {
        this.viewInited = false;
        this.subs.forEach(s => s.unsubscribe());
    }   
}
