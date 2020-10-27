import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { jqxSchedulerComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxscheduler';
import * as lodash from 'lodash';
import * as moment from 'moment';
import { WSDetail, AppointmentInfo, LocationInfo, ProviderInfo, ProviderLocationInfo, ServiceInfo, CommonItemContent, ScheduleInfo } from '@app/models';
import { createSchedulerSetupDialogWindow } from '@app-dialogs/scheduler-setup-dialog/scheduler-setup-dialog.component';
import { createEditAppointmentWindow } from '@app/component/appointment/calendar/edit-appointment/edit-appointment.component';
import { createChooseWindow } from '@app/component/appointment/calendar/choose/choose.component';
import { createSendAppointmentWindow } from '@app/component/appointment/calendar/send/send.component';
import { AlertService, SchedulerService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	selector: 'app-calendar',
	templateUrl: './calendar.component.html',
	styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, AfterViewInit {
	@Input() tabId = 1;
	@Input() scheduleInfo: ScheduleInfo = new ScheduleInfo;
	@Input() appointmentInfo: AppointmentInfo[] = [];

	@ViewChild('scheduler') scheduler: jqxSchedulerComponent;
		
	public showLocationValue = (l: LocationInfo) => l.address1;
	public showProviderValue = (p: ProviderInfo) => p.name;

	public appointments = [];
	public activeLocation: LocationInfo = null;
	public activeProvider: ProviderInfo = null;
	public contentHeight: number = 600;

	public loading: boolean = false;

	public startDate: Date;
	public endDate: Date;

	public days: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	public statuses: string [] = ['Booked', 'Open', 'Blocked'];
	public colors: string[] = ['green', 'orange', 'grey'];

	public wsDetails: WSDetail[]=[
		{id: 1, name: 'Calendar'},
		{id: 2, name: 'Locations'},
		{id: 3, name: 'Services'},
		{id: 4, name: 'Providers'},
		{id: 5, name: 'Hours'},
	];

	public views = [
		{ type: 'dayView', showWeekends: true, timeRuler: { scaleStartHour: 7, scaleEndHour: 21, formatString: 'HH:mm' } },
		{ type: 'weekView', showWeekends: true, timeRuler: { scaleStartHour: 7, scaleEndHour: 21, formatString: 'HH:mm' } },
		{ type: 'monthView', showWeekends: true, timeRuler: { scaleStartHour: 7, scaleEndHour: 21, formatString: 'HH:mm' } }
	]

	public activeViewType = 'weekView';

	public appointmentDataFields: any =
		{
			id: "id",
			uid: "uid",
			description: "notes",
			location: "location",
			subject: "status",
			from: "startTime",
			to: "endTime",
			color: "color",
			background: "background",
			borderColor: "borderColor",
			resourceId: "calendar"
		};
		
	public date: any = new jqx.date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
	public source: any;
	public dataAdapter: any;
	public resources: any;

	constructor(
		private windowService: WindowService,
		private schedulerService: SchedulerService,
		private alertService: AlertService,
		private elementRef: ElementRef
	) {
	}

	ngOnInit() {
		this.startDate = moment().startOf('week').utc().toDate();
		this.endDate = moment().endOf('week').utc().toDate();
		this.schedulerService.getScheduler().subscribe(res=> {
			if (res) {
				this.scheduleInfo = res;
				console.log(this.scheduleInfo);
			}
				
		});
		this.initSchedulerData();
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.alertService.playToast('Notification', 'Double click a cell that you want to edit or add.', 2, 5000);
			this.getAppointmentInfo(this.startDate.toUTCString(), this.endDate.toUTCString());
			this.scheduler.ensureAppointmentVisible('id1');
		});
	}

	getAppointmentInfo(from: string, to: string, locationUid: string = null, providerUid: string = null, name: string = null) {
		this.loading = true;
		this.schedulerService.getAppointments(from, to, locationUid, providerUid, name).subscribe(res=> {
			if (res) {
				this.appointmentInfo = res.filter(i=>i.status<4);	
				this.initSchedulerData();
			}
			else {
				this.appointmentInfo = [];
			}
			this.loading = false;
		})
	}

	onDateChange(event) {		
		if (this.loading) return;
		let startDate = event.args.from.toDate();
		let endDate = event.args.to.toDate();
		if (this.startDate <= startDate && this.endDate >= endDate)	return;		
		this.date = event.args.date;
		this.startDate = startDate;
		this.endDate = endDate;
		this.getAppointmentInfo(this.startDate.toUTCString(), this.endDate.toUTCString());		
	}

	onViewChange(event) {
		this.activeViewType = event.args.newViewType;
		this.onDateChange(event);		
	}

	onAppointmentDoubleClick(event: any) {
		let data = event.args.appointment['originalData'];
		console.log(lodash.cloneDeep(data));		
		data = lodash.find(this.appointments, {id: data['id']});
		if (!data['uid']) return;
		const appointment = lodash.find(this.appointmentInfo, {uid: data['uid']});
		if (!appointment) return;
		if (appointment['status'] <= 1) {
			let sendAppointment = createSendAppointmentWindow(
				this.windowService,
				this.getProvider(this.scheduleInfo.providers, data['providerUid']),
				this.getService(this.scheduleInfo.services, data['serviceUid']),
				appointment['startTime'],
				appointment['name'],
				appointment['email'],
				appointment['phone']
			);
			sendAppointment.componentRef.instance.submit.subscribe(res=> {				
				if (res) {
					this.loading = true;
					this.schedulerService.updateAppointmentStatus(data['uid'],'2').subscribe((res1) => {
						if (res1) {
							this.alertService.playToast('Success', 'This appointment is opened. Please check your email.', 0);
							appointment.status = 2;
							this.initSchedulerData();				
						}
						else {
							this.alertService.playToast('Failed', 'Something went wrong. Please try again.', 1);
						}
						this.loading = false;
					})
				}
				else {
					this.schedulerService.deleteAppointment(data['uid']).subscribe((res1) => {						
						if (res1) {
							this.alertService.playToast('Success', 'This appointment is canceled.', 0);
							this.appointmentInfo = this.appointmentInfo.filter(item=>item.uid != data['uid']);
							this.appointments = this.appointments.filter(item=>item.id != data['id']);
							this.scheduler.deleteAppointment(data['id']);
						}
						else {
							this.alertService.playToast('Failed', 'Something went wrong. please try again.', 1);
						}	
					})
				}				
			});	
			sendAppointment.open();
		}
		else {				
			let chooseAppointment = createChooseWindow(this.windowService, appointment['status']);
			chooseAppointment.componentRef.instance.submit.subscribe((res: number) => {
				this.loading = true;
				this.schedulerService.updateAppointmentStatus(data['uid'], res.toString()).subscribe((res1) => {					
					if (res1) {
						appointment.status = res;
						this.initSchedulerData();
					}
					this.loading = false;
				})				
			})
			chooseAppointment.open();
		}
	}	

	onCellClick(event) {		
	}

	onCellDoubleClick(event) {
		if (!this.scheduleInfo.services && !this.scheduleInfo.locations) {
			this.alertService.playToast('Notification', 'There is no any schedule information. \n Please go to the Editor and add a new Schedule.', 2);
			return;
		}		
		let appointmentWin = createEditAppointmentWindow(this.windowService, event.args.date.toDate(), this.scheduleInfo);
		appointmentWin.componentRef.instance.submit.subscribe(res=> {
			this.loading = true;
			this.schedulerService.addAppointment(res).subscribe(res1=> {
				if (res1) {
					this.alertService.playToast('Success', 'Appointment is booked.', 0);
					this.appointmentInfo.push(res1);
					this.initSchedulerData();
				}
				else {
					this.alertService.playToast('Failed', 'Something went wrong. please try again.', 1);
				}
				this.loading = false;
			});
		})
		appointmentWin.open();
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

	initSchedulerData() {
		this.source = {
			dataType: "array",
			dataFields: [
				{ name: 'id', type: 'string'},
				{ name: 'uid', type: 'string' },
				{ name: 'notes', type: 'string' },
				{ name: 'location', type: 'string' },
				{ name: 'serviceUid', type: 'string' },
				{ name: 'locationUid', type: 'string' },
				{ name: 'providerUid', type: 'string' },
				{ name: 'status', type: 'string' },
				{ name: 'startTime', type: 'date' },
				{ name: 'endTime', type: 'date' },
				{ name: 'calendar', type: 'string' },
				{ name: 'color', type: 'string' },
				{ name: 'background', type: 'string' },
				{ name: 'borderColor', type: 'string' }			
			],
			id: 'id',
			localData: this.generateAppointments()
		};
		
		this.dataAdapter = new jqx.dataAdapter(this.source);	
		
		this.resources = {
				colorScheme: "scheme02",
				dataField: "calendar",
				source: new jqx.dataAdapter(this.source)
			};
	}
		
	generateAppointments(): any {
		this.appointmentInfo = lodash.orderBy(this.appointmentInfo,['status'],['asc']);
		let appointmentInfo = [];
		if (this.appointmentInfo)
			appointmentInfo = this.appointmentInfo.filter(item=>
				(this.activeLocation ? item.locationUid == this.activeLocation.uid : true) &&
				(this.activeProvider ? item.providerUid == this.activeProvider.uid : true)
			);
		
		this.appointments = [];
		(appointmentInfo || []).forEach((info, index) => {
			let location = this.getLocation(this.scheduleInfo.locations, info.locationUid);
			let service = this.getService(this.scheduleInfo.services, info.serviceUid);
			let provider = this.getProvider(this.scheduleInfo.providers, info.providerUid);
			let startDate = moment.utc(info.startTime).local().toDate();
			let endDate = moment.utc(info.startTime).local().toDate();
			endDate.setHours(startDate.getHours() + 1);
			let item = {
				id: index.toString(),
				uid: info.uid,
				notes: info.notes,
				location: location ? location.address1 : '',
				providerUid: info.providerUid,
				locationUid: info.locationUid,
				serviceUid: info.serviceUid,
				startTime: startDate,
				endTime: endDate,
				calendar: this.statuses[info.status-1] || 'Booked',
				status: this.statuses[info.status-1] || 'Booked',
				color: this.colors[info.status-1] || 'green',
				borderColor: "white",
				background: 'white',
				email: info.email,
				name: info.name,
				phone: info.phone
			}			
			this.appointments.push(item);
		});
		return this.appointments;		
	};

	generateAppointments1(): any {
		// let sheduler = [];
		// let providers: ProviderInfo[] = [];		

		// if (['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.scheduleInfo.providerType) >= 0) {
		// 	providers.push(
		// 		new ProviderInfo(
		// 			this.scheduleInfo.companyName,
		// 			'',
		// 			this.scheduleInfo.locations.map(l => l.uid),
		// 			this.scheduleInfo.services.map(s=>s.uid),	
		// 			this.scheduleInfo.hoursOfOperation,
		// 			UUID.UUID(),
		// 			null
		// 		)
		// 	)
		// }
		// else if (this.activeProvider) {
		// 	providers = this.scheduleInfo.providers.filter(p=>p.uid == this.activeProvider.uid);
		// }		

		// if (['WeGoToCustomerLocation'].indexOf(this.scheduleInfo.locationType) < 0 && this.activeLocation) {
		// 	providers.forEach(p=> {
		// 		p.locations = p.locations.filter(l=>l==this.activeLocation.uid);
		// 	})
		// }	

		// providers.forEach(p=> {			
		// 	p.services.forEach(ps=> {
		// 		const service = this.getService(this.scheduleInfo.services, ps);
		// 		if (service) {
		// 			p.locations.forEach(psl=> {
		// 				const location = this.getLocation(this.scheduleInfo.locations, psl);
		// 				if (location) {
		// 					this.days.forEach(day=> {
		// 						const times = p.hoursOfOperation.times[day]
		// 						times.forEach(t=> {
		// 							let item = {
		// 								uid: p.uid,
		// 								description: service.description,
		// 								providerUid: p.name,	
		// 								locationUid: location.uid,
		// 								serviceUid: service.uid,
		// 								startTime: moment(t.startTime, 'HH:mm').toDate(),
		// 								endTime: moment(t.startTime, 'HH:mm').toDate(),
		// 								status: 'opened',
		// 								color: '',
		// 								borderColor: "white",
		// 								background: 'white',
		// 								email: '',
		// 								name: '',
		// 								phone: ''
		// 							}
		// 							sheduler.push(item);
		// 						})
		// 					})							
		// 				}						
		// 			})					
		// 		}				
		// 	})			
		// })	
		// return sheduler;
	};	

	gotoTab(tab: WSDetail) {
		this.tabId = tab.id;
		if (tab.id > 1) {
			let window = createSchedulerSetupDialogWindow(this.windowService, tab.id - 2);
        	window.open();
		}		
	}

	onLocationsChange(event) {
		this.activeLocation = event;		
		this.loading = true;
		this.initSchedulerData();
		this.loading = false;
	}

	onProvidersChange(event) {
		this.activeProvider = event;		
		this.loading = true;
		this.initSchedulerData();
		this.loading = false;
	}	
}
