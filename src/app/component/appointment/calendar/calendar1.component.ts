import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import * as lodash from 'lodash';
import * as moment from 'moment';
import { Maybe } from '@app-lib/maybe/maybe';
import { WSDetail, AppointmentInfo, LocationInfo, ProviderInfo, ProviderLocationInfo, ServiceInfo, CommonItemContent, ScheduleInfo } from '@app/models';
import { createSchedulerSetupDialogWindow } from '@app-dialogs/scheduler-setup-dialog/scheduler-setup-dialog.component';
import { AlertService, SchedulerService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
	selector: 'app-calendar',
	templateUrl: './calendar1.component.html',
	styleUrls: ['./calendar1.component.css']
})
export class CalendarComponent implements OnInit, AfterViewInit {

	@Input() tabId = 1;
	@Input() scheduleInfo: ScheduleInfo = new ScheduleInfo;
	@Input() appointmentInfo: AppointmentInfo[] = [];	
	
	public showLocationValue = (l: LocationInfo | string) => typeof l != 'object' ? l : l.address1;
	public showProviderValue = (p: ProviderInfo | string) => typeof p != 'object' ? p : p.name;

	public dispAppointmentInfo: AppointmentInfo[] = [];
	public activeLocation: LocationInfo | string = null;
	public activeProvider: ProviderInfo | string = null;

	public loading: boolean = false;

	public startDate: Date;
	public endDate: Date;

	public wsDetails: WSDetail[]=[
		{id: 1, name: 'Calendar'},
		{id: 2, name: 'Locations'},
		{id: 3, name: 'Services'},
		{id: 4, name: 'Providers'},
		{id: 5, name: 'Hours'},
	];

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private windowService: WindowService,
		private schedulerService: SchedulerService,
		private alertService: AlertService,
		private appService: AppService,
		private elementRef: ElementRef
	) {		
	}	

	ngOnInit() {		
		this.startDate = moment().startOf('week').utc().toDate();
		this.endDate = moment().endOf('week').utc().toDate();		
		this.schedulerService.getScheduler().subscribe(res=> {
			if (res) this.initScheduleInfo(res);
		});
		this.getAppointmentInfo(this.startDate.toUTCString(), this.endDate.toUTCString());
	}

	ngAfterViewInit(): void {
	}

	initScheduleInfo(res: ScheduleInfo) {
		this.scheduleInfo = res;
		this.activeProvider = null;
		this.activeLocation = null;
		
		if (this.scheduleInfo.providerType == 'SingleProviderDisplay' && this.scheduleInfo.providers && this.scheduleInfo.providers.length > 0) {
			this.activeProvider = this.scheduleInfo.providers[0];
		}		
	}

	getAppointmentInfo(from: string, to: string, locationUid: string = null, providerUid: string = null, name: string = null) {
		this.loading = true;
		this.schedulerService.getAppointments(from, to, locationUid, providerUid, name).subscribe(res=> {
			if (res) {
				this.appointmentInfo = res.filter(i=>i.status<4);				
			}
			else {
				this.appointmentInfo = [];				
			}
			this.dispAppointmentInfo = this.appointmentInfo;			
			this.loading = false;
		})
	}
	
	getProviders() {
		return !this.scheduleInfo.providers ? null : ['All Providers', ...this.scheduleInfo.providers];
	}

	getLocations() {
		return !this.scheduleInfo.locations ? null : ['All Locations', ...this.scheduleInfo.locations];
	}
	
	getProvider(providers: ProviderInfo[], uid: string): ProviderInfo{
		return lodash.find(providers, {uid: uid})
	}

	getService(services: ServiceInfo[], uid: string): ServiceInfo{
		return lodash.find(services, {uid: uid})
	}

	getLocation(locations: LocationInfo[], uid: string): LocationInfo{
		return lodash.find(locations, {uid: uid})
	}		

	gotoTab(tab: WSDetail) {
		this.tabId = tab.id;
		if (tab.id > 1) {
			this.changeDetectorRef.detach();
			let window = createSchedulerSetupDialogWindow(this.windowService, tab.id - 2, new CommonItemContent<ScheduleInfo>(Maybe.just(this.scheduleInfo)));
			window.componentRef.instance.submit.subscribe(res=> {
				window.destroy();
				console.log(JSON.stringify(res.info.value));
				// this.initScheduleInfo(res.info.value);
				this.schedulerService.updateScheduler(res.info.value).subscribe(res1=> {
					
					if (res1) {
						if (this.appService._currentPage || this.appService._currentPage.service == 23) {
							let serviceItems = this.appService.getServiceItem(this.appService._currentPage, 23);							
							if (serviceItems && serviceItems.length > 0) {
								(serviceItems[0].content as any).info.value = res1;								
							}
						}						
						this.initScheduleInfo(res1);
					}
				})
				this.changeDetectorRef.reattach();
			})
			window.componentRef.instance.close.subscribe(res=> {
				window.destroy();
				this.changeDetectorRef.reattach();
			})			
        	window.open();
		}		
	}

	onDateChange(date: Date) {
		this.startDate = date;		
		this.endDate = moment(this.startDate).add(6, 'day').toDate();
		this.getAppointmentInfo(
			this.startDate.toUTCString(),
			this.endDate.toUTCString(),
			!this.activeProvider || this.activeProvider === 'All Providers' ? null : (this.activeProvider as ProviderInfo).uid,
			!this.activeLocation || this.activeLocation === 'All Locations' ? null : (this.activeLocation as LocationInfo).uid
		);
	}

	onLocationsChange(event) {
		this.activeLocation = event;
		if (this.activeLocation == 'All Locations') {
			this.dispAppointmentInfo = this.appointmentInfo.filter(item=>
				(this.activeProvider ? item.providerUid == (this.activeProvider as ProviderInfo).uid : true));
		}
		else {
			this.dispAppointmentInfo = this.dispAppointmentInfo.filter(item=>item.locationUid == (this.activeLocation as LocationInfo).uid);
		}		
	}

	onProvidersChange(event) {
		this.activeProvider = event;
		if (this.activeProvider == 'All Providers') {
			this.dispAppointmentInfo = this.appointmentInfo.filter(item=>
				(this.activeLocation ? item.locationUid == (this.activeLocation as LocationInfo).uid : true));
		}
		else {
			this.dispAppointmentInfo = [].concat(this.dispAppointmentInfo.filter(item=>item.providerUid == (this.activeProvider as ProviderInfo).uid));			
		}
	}	
}
