import {
    Component, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, Renderer,
    Input, Output, OnDestroy, OnInit, AfterViewInit, ViewChild,
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
   SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as moment from 'moment';
import { Box } from '@app-lib/rect/rect';
import { matchEmail, emailValidator } from '@app-lib/validators/form-validator';
import { createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';

import { createImageEditorWindow, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.component';
import { Item, CommonItemContent, ImagePath, AppointmentInfo, LocationInfo, ProviderInfo, ServiceInfo, ScheduleInfo, HourInfo } from '@app/models';
import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
import { AlertService, SchedulerService } from '@app/services';

@Component({
   moduleId: module.id,
   selector: 'appointment-item',
   templateUrl: 'appointment.component.html',
   styleUrls: ['appointment.component.css']
})

export class AppointmentItemComponent implements OnInit, OnDestroy, AfterViewInit{
    @Input() item     : Item;
    @Output() itemChange = new EventEmitter<Item>();
    @Output() itemResize = new EventEmitter<Box>();
    @Output() itemRemove = new EventEmitter<void>();

    @ViewChild('reviewContainer') reviewContainer: ElementRef;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;

    public itemContent: CommonItemContent<ScheduleInfo>;
    public scheduleInfo: ScheduleInfo;
    public date: Date;

	showLocationValue = (l: LocationInfo) => l ? l.address1 + ', ' + l.address2 + ', ' + l.city + ', ' + l.province + ' ' + l.postalCode: '';
	showServiceValue = (s: ServiceInfo) => s ? s.title : '';
	showProviderValue = (p: ProviderInfo) => p ? p.name : '';

	loading: boolean = false;
    form: FormGroup;

    days: string[] = ['sun', 'mon', 'tue', 'wed', 'tur', 'fri', 'sat'];
    dates: Date[] = [];
    datesNum: number = 7; // the number of dates for displaying. mobile: 3, laptop: 7

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
    isMonthBeginning: boolean = true;

	enableProviders = () => {
        // console.log(['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.scheduleInfo.providerType) < 0 && this.providers && this.providers.length > 0)
		return ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.scheduleInfo.providerType) < 0 && this.providers && this.providers.length > 0;
	}

    private windowSize: number = 1000;
	private viewInited: boolean = false;
	private time = new Date().getTime();
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        private sanitizer: DomSanitizer,
        private renderer: Renderer,
        private alertService: AlertService,
        private schedulerService: SchedulerService,
        private windowService: WindowService,
        private appService: AppService
	) { }

	ngOnInit() {
        const d = this.date || new Date;
        this.itemContent = this.item.content as CommonItemContent<ScheduleInfo>;
        this.scheduleInfo = lodash.cloneDeep(this.itemContent.info.value);

		if (this.scheduleInfo.locations && this.scheduleInfo.locations.length>0) {
            this.locations = this.scheduleInfo.locations.filter(l=>l.editStatus != 'Deleted');
        }
        if (this.scheduleInfo.providers && this.scheduleInfo.providers.length>0) {
            this.providers = this.scheduleInfo.providers.filter(p=>p.editStatus != 'Deleted');
        }
        if (this.scheduleInfo.services && this.scheduleInfo.services.length>0) {
            this.services = this.scheduleInfo.services.filter(s=>s.editStatus != 'Deleted');
        }

        let enableProviders = this.enableProviders();

        if (enableProviders && this.providers.length > 1)
            this.provider = this.providers[0];

        if (!enableProviders)
            this.location = this.getSelectedFirstLocation();
        else if (this.locations)
            this.location = this.locations[0];

        if (['SingleProviderHidden'].indexOf(this.scheduleInfo.providerType) >= 0 && this.services && this.services.length == 1)
            this.service = this.services[0];
        else
            this.service = this.getSelectedFirstService();

        this.form = this.formBuilder.group({
            uid   : [''],
            providerUid : [this.enableProviders() ? this.providers[0].uid : ''],
            locationUid: [''],
            serviceUid : [''],
            startTime  : [new Date, Validators.required],
            endTime  : [new Date, Validators.required],
            name  : ['', Validators.required],
            phone : ['', Validators.required],
            email : ['', { updateOn: 'blur', validators: [ Validators.required, emailValidator ] }],
            notes : ['']
        });

        this.swiperProviderConfig = {
            direction: 'horizontal',
            observer: true,
            initialSlide: -1,
            slidesPerView: 1,
            spaceBetween: 5,
            grabCursor: true,
        };

        this.setTimes();
        this.subs = [
        ];
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.setElementHeight();
        },0);
    }

    setElementHeight() {
        const height = this.item.content.box.height();
        if (this.reviewContainer) {
            const eleHeight = (this.reviewContainer.nativeElement as HTMLElement).offsetHeight + 100;
            if (this.directiveRef) {
                this.directiveRef.setIndex(this.activeProviderIndex);
                this.directiveRef.update();
            }
            if (height != eleHeight) {
                this.itemResize.emit(this.itemContent.box.setBottom(this.itemContent.box.top + eleHeight));
            }
            this.viewInited = true;
        }
    }

	setTimes() {
		let hourInfo: HourInfo;
        this.startTimes = [];
        this.endTimes = [];
        this.serviceTimes = [];

        if (this.provider) {
            if (this.scheduleInfo.locationType == 'WeGoToCustomerLocation') {
                if (this.provider.hoursOfOperation)
                    hourInfo = this.provider.hoursOfOperation;
            }
            else if (this.location && this.provider.locations && this.provider.locations.length > 0) {
                let location = this.provider.locations.find(l=>l.locationUid == this.location.uid);
                if (location) {
                    hourInfo = location.hoursOfOperation;
                }
            }

            if (!hourInfo && this.provider.hoursOfOperation)
                hourInfo = this.provider.hoursOfOperation;
        }

        if (!hourInfo && this.scheduleInfo.hoursOfOperation) {
            hourInfo = this.scheduleInfo.hoursOfOperation;
        }

		if (hourInfo) {
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day=> {
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
        this.setDates(new Date);
		// console.log(this.serviceTimes, this.firstDay);
    }

    setDates(d: Date, offset: number = 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Tur', 'Fri', 'Sat'];
        let today = moment(d);
        let workday = lodash.cloneDeep(today);

        if (this.reviewContainer.nativeElement && (this.reviewContainer.nativeElement as HTMLElement).offsetWidth <= 560) {
            this.datesNum = 3;
        }

        this.dates = [d];
        for (let i=1; i<this.datesNum; i++) {
            this.dates.push(workday.add(1, 'day').toDate());
        }
        let firstDay = today.weekday();
        this.days = [...days.slice(firstDay), ...days.slice(0, firstDay)];
        firstDay -= offset;
        this.startTimes = [...this.startTimes.slice(firstDay), ...this.startTimes.slice(0, firstDay)];
        this.endTimes = [...this.endTimes.slice(firstDay), ...this.endTimes.slice(0, firstDay)];
        this.serviceTimes = [...this.serviceTimes.slice(firstDay), ...this.serviceTimes.slice(0, firstDay)];
    }

	setFormValue() {
    }

    getLocations(uids: string[]) {
        if (!uids) return [];
        let locations = (this.locations || []).filter(l=>uids.indexOf(l.uid)>=0);
        return locations;
    }

    getServices(uids: string[]) {
        if (!uids) return [];
        let services = (this.services || []).filter(s=>uids.indexOf(s.uid)>=0);
        return services;
    }

    getSelectedFirstLocation() {
        if (this.enableProviders()) {
            let provider = this.providers[this.activeProviderIndex];
            if (provider && provider.locations && provider.locations.length > 0) {
                let res = this.getLocations([provider.locations[0].locationUid]);
                if (res && res.length > 0)
                    return res[0];
            }
        }
        else if (this.scheduleInfo.locationType == 'CustomerComesToUs' && this.locations && this.locations.length > 0) {
            return this.locations[0];
        }
        return null;
    }

    getSelectedFirstService() {
        if (this.scheduleInfo.providers) {
            let provider = this.scheduleInfo.providers[this.activeProviderIndex];
            if (provider && provider.services && provider.services.length > 0) {
                let res = this.getServices([provider.services[0]]);
                if (res && res.length > 0)
                    return res[0];
            }
        }
        return null;
    }

    getSelectedLocations() {
        if (this.providers) {
            let provider = this.providers[this.activeProviderIndex];
            if (provider && provider.locations && provider.locations.length > 0) {
                return this.getLocations(provider.locations.map(item=>item.locationUid));
            }
        }
        return [];
    }

    getSelectedServices() {
        if (this.providers) {
            let provider = this.providers[this.activeProviderIndex];
            if (provider && provider.services && provider.services.length > 0) {
                return this.getServices(provider.services);
            }
        }
        return [];
    }

	onLocationsChange(event) {
        if (!this.enableProviders() || this.provider && this.provider.locations.findIndex(l=>l.locationUid == event.uid) >=0 ) {
            this.location = event;
            this.form.controls['locationUid'].setValue(event.uid);
            this.setTimes();
        }
        else {
            let p = this.providers.findIndex(provider=>provider.locations && provider.locations.findIndex(l=>l.locationUid == event.uid) >=0 );
            if (p >= 0) {
                this.location = event;
                this.directiveRef.setIndex(p);
            }
            else {
                // this.location = event;
                // this.form.controls['locationUid'].setValue(event.uid);
                this.alertService.playToast('Warning','There is no provder at this location.', 2);
            }
        }
    }

    onServicesChange(event) {
        if (['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.scheduleInfo.providerType) >= 0 || this.provider && this.provider.services.indexOf(event.uid) >=0) {
            this.service = event;
            this.form.controls['serviceUid'].setValue(event.uid);
        }
        else {
            let p = this.providers.findIndex(provider=>provider.services && provider.services.indexOf(event.uid) >=0 );
            if (p >= 0) {
                this.service = event;
                this.directiveRef.setIndex(p);
            }
            else {
                this.alertService.playToast('Warning','There is no provder who provides this service.', 2);
            }
        }
    }

    onMonthPrev(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isMonthBeginning) return;
        let date = moment(this.dates[this.activeDateIndex]).subtract(1, 'month');
        if (date.get('month') == moment().get('month')) {
            this.isMonthBeginning = true;
            this.isDateBeginning = true;
            this.setDates(new Date, moment(this.dates[0]).weekday());
        }
        else {
            date = date.set('date', 1);
            this.setDates(date.toDate(), moment(this.dates[0]).weekday());
        }
    }

    onMonthNext(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isMonthBeginning = false;
        this.isDateBeginning = false;
        let date = moment(this.dates[this.activeDateIndex]).add(1, 'month');
        date = date.set('date', 1);
        this.setDates(date.toDate(), moment(this.dates[0]).weekday());
    }

    onDatePrev(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isDateBeginning) return;

        this.dates = [moment(this.dates[0]).subtract(1, 'day').toDate(), ...this.dates.slice(0, this.datesNum - 1)];
        this.days = [this.days[6], ...this.days.slice(0,6)];
        this.startTimes = [this.startTimes[6], ...this.startTimes.slice(0, 6)];
        this.endTimes = [this.endTimes[6], ...this.endTimes.slice(0, 6)];
        this.serviceTimes = [this.serviceTimes[6], ...this.serviceTimes.slice(0, 6)];
        if (moment(this.dates[0])<= moment())
            this.isDateBeginning = true;
        setTimeout(() => {
            this.setElementHeight();
        });
    }

    onDateNext(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDateBeginning = false;
        this.dates = [...this.dates.slice(1), moment(this.dates[this.datesNum - 1]).add(1, 'day').toDate()];
        this.days = [...this.days.slice(1), this.days[0]];
        this.startTimes = [...this.startTimes.slice(1), this.startTimes[0]];
        this.endTimes = [...this.endTimes.slice(1), this.endTimes[0]];
        this.serviceTimes = [...this.serviceTimes.slice(1), this.serviceTimes[0]];
        setTimeout(() => {
            this.setElementHeight();
        });
    }

    indexProviderChanged(event) {
        if (!this.viewInited) return;
        this.isProviderBeginning = (event == 0);
        this.isProviderEnd = (event == this.providers.length-1);
        this.activeProviderIndex = event;

        this.provider = this.providers[this.activeProviderIndex];
        if (!this.location || this.provider.locations.findIndex(l=>l.locationUid == this.location.uid) < 0 ) {
            this.location = this.getSelectedFirstLocation();
        }

        if (!this.service || this.provider.services.indexOf(this.service.uid) < 0 ) {
            this.service = this.getSelectedFirstService();
        }

        this.setTimes();

        this.form.patchValue({
            providerUid: this.provider.uid,
            locationUid: this.location ? this.location.uid : '',
            serviceUid : this.service ? this.service.uid : ''
        });
    }

    onDateClick(event: MouseEvent, date: Date, i: number) {
        event.stopPropagation();
        event.preventDefault();
        this.activeDateIndex = i;

        this.form.patchValue({
            startTime: moment(date).format('MM/DD/YYYY HH:mm:ss'),
            endTime: moment(date).format('MM/DD/YYYY HH:mm:ss')
        });

        if (!this.serviceTimes[i] || this.serviceTimes[i].length == 0) {
            this.alertService.playToast('Warning', 'Closed', 2);
        }

        setTimeout(() => {
            this.setElementHeight();
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

	onSubmit(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (this.scheduleInfo.isNew) {
            this.alertService.playToast('Warning', 'You need to save this page before you make an appointment. Please click Save button.', 2);
            return;
        }
        let data = lodash.cloneDeep(this.form.value);
        data.startTime = moment(data.startTime,'MM/DD/YYYY HH:mm:ss').utc().format('MM/DD/YYYY HH:mm:ss');
		data.endTime = moment(data.endTime,'MM/DD/YYYY HH:mm:ss').utc().format('MM/DD/YYYY HH:mm:ss');
		this.schedulerService.addAppointment(data).subscribe(res1=> {
            if (res1) {
                this.alertService.playToast('Success', 'Appointment is booked.', 0);
            }
            else {
                this.alertService.playToast('Failed', 'Something went wrong. please try again.', 1);
            }
        });
	}

	backgroundImage(item): SafeStyle {
        if (item['dispUrl'] && this.appService._currentSite.url)
            return this.sanitizer.bypassSecurityTrustStyle(`url('${'https://' + this.appService._currentSite.url + '/' + item['dispUrl']}')`);
        let img = item['photo'];
        return this.sanitizer.bypassSecurityTrustStyle(img && img.name ? `url('${img.location + '/' + img.name}')` : `url('assets/images/canvas/person.png')`);
    }

    onContainerClick(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

	refreshView(loading: boolean = false) {
        if (!this.viewInited) return;
		this.loading = loading;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
        this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize(event: UIEvent) {
        let windowSize = window.innerWidth;
        if (windowSize < 560 && this.windowSize >= 560 || windowSize >= 560 && this.windowSize < 560) {
            this.windowSize = windowSize;
            this.setDates(this.dates[0], moment(this.dates[0]).weekday());
        }
    }
}
