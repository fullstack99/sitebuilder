import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { LocationsModule } from '@app-dialogs/scheduler-setup-dialog/locations/locations.module';
import { ServicesModule } from '@app-dialogs/scheduler-setup-dialog/services/services.module';
import { ProvidersModule } from '@app-dialogs/scheduler-setup-dialog/providers/providers.module';
import { HoursModule } from '@app-dialogs/scheduler-setup-dialog/hours/hours.module';
import { WindowService } from '@app-common/window/window.service';

import { SchedulerSetupDialogComponent } from '@app-dialogs/scheduler-setup-dialog/scheduler-setup-dialog.component';

@NgModule({
	declarations: [
		SchedulerSetupDialogComponent
	],
	imports: [
		SharedModule,
		AttentionDialogModule,
		MenubarModule,
		LocationsModule,
		ServicesModule,
		ProvidersModule,
		HoursModule
	],
	providers: [
		WindowService
	],
	entryComponents: [
		SchedulerSetupDialogComponent
	]
})
export class CalendarSetupDialogModule {}
