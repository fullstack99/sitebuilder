import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { ChooseTimeModule } from '@app-ui/choose-time/choose-time.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { SchedulerService } from '@app/services';
import { AppointmentItemComponent } from '@app-items/appointment/appointment.component';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 'auto'    
};

@NgModule({
    imports: [
        CommonModule,        
        FormsModule,
        ReactiveFormsModule,
        SwiperModule,
        ChooseTimeModule,
        DropDownModule,
        GoogleMapsDialogModule,        
        SplitTextBoxModule
    ],
    declarations: [ AppointmentItemComponent ],
    exports: [ AppointmentItemComponent ],
    providers: [ 
        WindowService,
        SchedulerService,
        {
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
    ],
    entryComponents: [ AppointmentItemComponent ]
})

export class AppointmentItemModule {
}
