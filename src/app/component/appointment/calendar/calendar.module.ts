import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '@app-shared/shared.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';

import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { ChooseTimeModule } from '@app-ui/choose-time/choose-time.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { CalendarSetupDialogModule } from '@app-dialogs/scheduler-setup-dialog/scheduler-setup-dialog.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { jqxSchedulerComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxscheduler';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { CalendarComponent } from '@app/component/appointment/calendar/calendar.component';
import { EditAppointmentComponent } from '@app/component/appointment/calendar/edit-appointment/edit-appointment.component';
import { ChooseComponent } from '@app/component/appointment/calendar/choose/choose.component';
import { SendAppointmentComponent } from '@app/component/appointment/calendar/send/send.component';
import { SchedulerService } from '@app/services';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 'auto'    
};

const routes: Routes = [
	{ path: '', component: CalendarComponent }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

@NgModule({
	imports: [
		SharedModule,
		SwiperModule,
		LoadingModule,
        ChooseTimeModule,        
        GoogleMapsDialogModule,
		CalendarSetupDialogModule,
		CheckboxModule,
		DateTimeModule,
		DropDownModule,
		RadioGroupModule,
		SplitTextBoxModule,
		MenubarModule,
		routing
	],
	declarations: [
		jqxSchedulerComponent,
		CalendarComponent,
		ChooseComponent,
		EditAppointmentComponent,		
		SendAppointmentComponent
	],
	exports: [
		CalendarComponent,
		EditAppointmentComponent
	],
	entryComponents: [CalendarComponent, EditAppointmentComponent, ChooseComponent, SendAppointmentComponent],
	providers: [
		SchedulerService,
		{
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
	]
})
export class CalendarModule { }
