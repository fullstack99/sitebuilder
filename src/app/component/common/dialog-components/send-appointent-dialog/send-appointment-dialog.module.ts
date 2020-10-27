import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { SendAppointmentComponent } from '@app-dialogs/send-appointent-dialog/send.component';
import { SchedulerService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';

@NgModule({
	declarations: [				
		SendAppointmentComponent
	],
	imports: [
		SharedModule		
	],	
	exports: [
		SendAppointmentComponent
	],
	entryComponents: [
		SendAppointmentComponent
	],
	providers: [
		SchedulerService,
		WindowService
	]
})
export class SendAppointmentDialogModule { }
