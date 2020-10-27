import {
	Component, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, Renderer,
	Input, Output, OnInit, OnDestroy, AfterViewInit, ViewChild, ViewChildren, QueryList
} from '@angular/core';
import { FormControl, FormGroup, Validator, Validators, FormBuilder } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
   SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as moment from 'moment';

import { matchEmail, emailValidator } from '@app-lib/validators/form-validator';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';

import { ImagePath, AppointmentInfo, LocationInfo, ProviderInfo, ServiceInfo, ScheduleInfo, HourInfo } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createEditAppointmentWindow(
	windowService: WindowService,
	date: Date = null,
	scheduleInfo: ScheduleInfo = new ScheduleInfo,
	appointmentInfo: AppointmentInfo = new AppointmentInfo	
): DialogWindow<EditAppointmentComponent> {
  	return windowService.create<EditAppointmentComponent>(
		EditAppointmentComponent,
			{            
				width: 600,
				position: {
					left: 'calc(50% - 300px)',
					top: '50px'
				},
				minWidth: 320,
				maxWidth: 600, 
				maxHeight: 800,
				modal: true,
				draggable: true,
				resizable: true,
				scrollable: false,
				visible: false,
				title: false
			}
	)
	.changeInputs(
		(comp, window) => {
			comp.scheduleInfo = scheduleInfo;
			comp.appointmentInfo = appointmentInfo;
			comp.date = date;
			comp.close.subscribe(() => window.close());
			comp.submit.subscribe(() => window.close());
		});
}

@Component({
	selector: 'app-edit-appointment',
	templateUrl: './edit-appointment.component.html',
	styleUrls: ['./edit-appointment.component.css']
})

export class EditAppointmentComponent implements OnInit, OnDestroy, AfterViewInit {
	
	@Input() appointmentInfo: AppointmentInfo;
	@Input() scheduleInfo: ScheduleInfo;
	@Input() date: Date;

	@Output() submit = new EventEmitter<AppointmentInfo>();
	@Output() close = new EventEmitter<boolean>();

	@ViewChild('providerSwiper') providerSwiper: any;    
    @ViewChild('dateSwiper') dateSwiper: any;
    @ViewChild('dateSwiper') monthSwiper: any;
	@ViewChildren(SwiperDirective) directiveRefs: QueryList<SwiperDirective>;
	
	showLocationValue = (l: LocationInfo) => l.address1 + ', ' + l.address2 + ', ' + l.city + ', ' + l.province;
	showServiceValue = (s: ServiceInfo) => s.title;
	showProviderValue = (p: ProviderInfo) => p.name;
	
	loading: boolean = false;
	form: FormGroup;

	months: Date[] = [];
    days: string[] = ['sun', 'mon', 'tue', 'wed', 'tur', 'fri', 'sat'];
    dates: number[] = [];
    firstDay: number = 0;    

    serviceTimes: { startTime: string; endTime: string; }[][]=[];
    startTimes: boolean[] = [false, false, false, false, false, false, false];
    endTimes: boolean[] = [false, false, false, false, false, false, false];    
	
	location: LocationInfo = null;
    service: ServiceInfo = null;
	provider: ProviderInfo = null;

    locations: LocationInfo[] = [];
    services: ServiceInfo[] = [];
	providers: ProviderInfo[] = [];
	
    activeProviderIndex: number = 0;
    isProviderBeginning: boolean = true;
    isProviderEnd: boolean = false;
    swiperProviderConfig: SwiperConfigInterface;

    activeDateIndex: number = 0;
    isDateBeginning: boolean = true;
    isDateEnd: boolean = false;
    swiperDateConfig: SwiperConfigInterface;

    activeMonthIndex: number = 0;
    isMonthBeginning: boolean = true;
    isMonthEnd: boolean = false;
    swiperMonthConfig: SwiperConfigInterface;

	enableProviders = () => {
		return ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.scheduleInfo.locationType) < 0 && this.scheduleInfo.providers && this.scheduleInfo.providers.length > 0		
	}

	private viewInited: boolean = false;
	
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        private sanitizer: DomSanitizer,
        private renderer: Renderer,
		private windowService: WindowService
	) { }

	ngOnInit() {
		const d = this.date || new Date;		

		if (this.scheduleInfo.locations && this.scheduleInfo.locations.length>0) {            
            this.locations = this.scheduleInfo.locations;            
        }            
        if (this.scheduleInfo.providers && this.scheduleInfo.providers.length>0) {
            this.providers = this.scheduleInfo.providers;            
        }            
        if (this.scheduleInfo.services && this.scheduleInfo.services.length>0) {
            this.services = this.scheduleInfo.services;            
		}

		console.log(this.enableProviders());

		this.form = this.formBuilder.group({
			uid   		: [this.appointmentInfo.uid || ''],
			providerUid : [(this.enableProviders() && this.appointmentInfo.providerUid == '') ? this.providers[0].uid : this.appointmentInfo.providerUid, Validators.required],
			locationUid : [this.appointmentInfo.locationUid],
			serviceUid  : [this.appointmentInfo.serviceUid, Validators.required],
			startTime   : [this.appointmentInfo.startTime, Validators.required],
			endTime  	: [this.appointmentInfo.endTime, Validators.required],
			name  		: [this.appointmentInfo.name, Validators.required],
			phone 		: [this.appointmentInfo.phone, Validators.required],
			email 		: [this.appointmentInfo.email, { updateOn: 'blur', validators: [ Validators.required, emailValidator ] }],
			notes 		: [this.appointmentInfo.notes]
		});		

        this.swiperMonthConfig = {
            direction: 'horizontal',
            observer: true,
            initialSlide: -1,
            slidesPerView: 1,
            spaceBetween: 5,
            grabCursor: true
        };
        
        this.swiperDateConfig = {
            direction: 'horizontal',
            observer: true,
            initialSlide: -1,
            // slidesPerView: 'auto',
            slidesPerView: 7,
            spaceBetween: 5,
            grabCursor: true
        };

        this.swiperProviderConfig = {
            direction: 'horizontal',
            observer: true,
            initialSlide: -1,
            slidesPerView: 1,
            spaceBetween: 5,
            grabCursor: true            
		};	

		for(let i=0; i<2; i++) {
            for(let j=0; j<12; j++) {
                let month = new Date(d.getFullYear()+i, j);
                if (i==0 && d.getMonth()==j) this.activeMonthIndex = j;
                this.months.push(month);
            }
		}

		this.activeDateIndex = d.getDate() - 1;
		this.service = lodash.find(this.services, {uid: this.appointmentInfo.serviceUid});
		this.provider = lodash.find(this.providers, {uid: this.appointmentInfo.providerUid});
		this.location = lodash.find(this.locations, {uid: this.appointmentInfo.locationUid});
		
		this.setTimes();
		console.log(this.scheduleInfo);
		this.form.valueChanges.subscribe(res => {
			console.log(res);
			this.refreshView();
		})
	}

	ngAfterViewInit() {		
		setTimeout(() => {
			const directiveRefs = this.directiveRefs.toArray();
			directiveRefs.forEach((d, index) => {
				if (index==0) {
					if (directiveRefs.length > 2)
						d.setIndex(this.activeProviderIndex);
					else
						d.setIndex(this.activeMonthIndex);
				}
				else if (index==1) {
					if (directiveRefs.length > 2)
						d.setIndex(this.activeMonthIndex);
					else
						d.setIndex(this.activeDateIndex);
				}
				else {
					d.setIndex(this.activeDateIndex);
				}				
				d.update();
			});			
			this.viewInited = true;			
		});		
	}
	
	setTimes() {
		let hourInfo: HourInfo;
		const d = new Date;
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Tur', 'Fri', 'Sat'];

		if (this.provider) {			
			hourInfo = this.provider.hoursOfOperation;
		}
		else {
			hourInfo = this.scheduleInfo.hoursOfOperation;
		}

		if (hourInfo) {
            this.startTimes = [null];
            this.endTimes = [null];
            this.serviceTimes = [[]];
            Object.keys(hourInfo.times).forEach(day=> {
                const dayServiceTimes = hourInfo.times[day]; 
                this.serviceTimes.push(hourInfo.times[day]);                
                if (dayServiceTimes && dayServiceTimes.length>0) {
                    const s = dayServiceTimes.filter(dayServiceTime => moment(dayServiceTime.startTime, 'HH:mm').isAfter(moment('12:00', 'HH:mm')));
                    const e = dayServiceTimes.filter(dayServiceTime => moment(dayServiceTime.endTime, 'HH:mm').isAfter(moment('12:00', 'HH:mm')));
                    this.startTimes.push(s.length>0);
                    this.endTimes.push(e.length>0);
                }
                else {
                    this.startTimes.push(null);
                    this.endTimes.push(null);
                }                    
            });
		}
		
        this.dates = lodash.range(0,new Date(d.getFullYear() , d.getMonth()+1, 0).getDate());
        this.firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
        this.days = [...days.slice(this.firstDay), ...days.slice(0, this.firstDay)];
        this.startTimes = [...this.startTimes.slice(this.firstDay), ...this.startTimes.slice(0, this.firstDay)];
        this.endTimes = [...this.endTimes.slice(this.firstDay), ...this.endTimes.slice(0, this.firstDay)];
		this.serviceTimes = [...this.serviceTimes.slice(this.firstDay), ...this.serviceTimes.slice(0, this.firstDay)];
		console.log(this.serviceTimes, this.firstDay);
	}

	setFormValue() {
	}
	
	onLocationsChange(event) {
        this.location = event;
        this.form.controls['locationUid'].setValue(event.uid);
    }

    onServicesChange(event) {
        this.service = event;
        this.form.controls['serviceUid'].setValue(event.uid);
    }   
    
    indexMonthChanged(event) {
        if (!this.viewInited) return;
        this.isMonthBeginning = (event == 0);
        this.isMonthEnd = (event == this.months.length-1);
        this.activeMonthIndex = event;
    }
    
    indexDateChanged(event) {
        if (!this.viewInited) return;
        this.isDateBeginning = (event == 0);
        this.isDateEnd = (event == this.dates.length-1);        
    }

    indexProviderChanged(event) {
        if (!this.viewInited) return;
        this.isProviderBeginning = (event == 0);
        this.isProviderEnd = (event == this.scheduleInfo.providers.length-1);
        this.activeProviderIndex = event;
        this.form.controls['providerUid'].setValue(this.providers[this.activeProviderIndex].uid);
    }    

    onDateClick(event: MouseEvent, i: number = 0) {
        event.stopPropagation();
        event.preventDefault();
        this.activeDateIndex = i;
		let d = new Date(this.months[this.activeMonthIndex]);
		d.setDate(i+1);
		// this.setTimes();
		this.form.patchValue({
			startTime: moment(d).format('MM/DD/YYYY HH:mm:ss'),
			endTime: moment(d).format('MM/DD/YYYY HH:mm:ss')
		});		
	}

    onSelectTime(event) {
		this.form.patchValue({
			startTime: moment(this.form.controls['startTime'].value, 'MM/DD/YYYY HH:mm:ss').set({
							hour : event.h,
							minute  : event.m,
							second : 0
						}).format('MM/DD/YYYY HH:mm:ss'),
			endTime: moment(this.form.controls['endTime'].value, 'MM/DD/YYYY HH:mm:ss').set({
							hour : event.h + 1,
							minute  : event.m, 
							second : 0
						}).format('MM/DD/YYYY HH:mm:ss')
		});        
    }

    openGoogleMapsDialog() {        
		let googleMaps = createGoogleMapsDialogWindow(this.windowService, this.showLocationValue(this.location));		
		googleMaps.componentRef.instance.outLocation.subscribe(result => {
			googleMaps.destroy();
		});        		
        googleMaps.open();
    }

	openFeedbackDialog() {		
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');		
		feedbackWindow.open();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {               
        let data = lodash.cloneDeep(this.form.value);
        data.startTime = moment(data.startTime,'MM/DD/YYYY HH:mm:ss').utc().format('MM/DD/YYYY HH:mm:ss');
		data.endTime = moment(data.endTime,'MM/DD/YYYY HH:mm:ss').utc().format('MM/DD/YYYY HH:mm:ss');
		this.submit.emit(data);        
	}

	backgroundImage(img: ImagePath): SafeStyle {
        return this.sanitizer.bypassSecurityTrustStyle(img && img.name ? `url('${img.location + '/' + img.name}')`: `url('assets/images/canvas/person.png')`);    
    }
	
	refreshView(loading: boolean = false) {
		this.loading = loading;		
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
