import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { ChooseTimeModule } from '@app-ui/choose-time/choose-time.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { CalendarSetupDialogModule } from '@app-dialogs/scheduler-setup-dialog/scheduler-setup-dialog.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { EditAppointmentComponent } from '@app-dialogs/edit-appointment-dialog/edit-appointment.component';
import { SchedulerService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 'auto'    
};

@NgModule({
	declarations: [		
		EditAppointmentComponent		
	],
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
		SplitTextBoxModule		
	],	
	exports: [		
		EditAppointmentComponent
	],
	entryComponents: [EditAppointmentComponent],
	providers: [
		SchedulerService,
		WindowService,
		{
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
	]
})
export class EditAppointmentDialogModule { }
