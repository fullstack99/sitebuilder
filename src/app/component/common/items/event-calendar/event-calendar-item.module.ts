import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { EventSignUpDialogModule } from '@app-dialogs/event-signup-dialog/event-signup-dialog.module';
import { EventCheckoutDialogModule } from '@app-dialogs/event-checkout-dialog/event-checkout-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';

import { EventCalendarItemComponent } from './event-calendar.component';
import { EventReportComponent } from './event-report/event-report.component';

import { WindowService } from '@app-common/window/window.service';
import { EventService } from '@app/services/event.service';

@NgModule({
	declarations: [ EventCalendarItemComponent, EventReportComponent ],
	exports: [ EventCalendarItemComponent, EventReportComponent ],
	imports: [  CommonModule,
				FormsModule,
				ReactiveFormsModule,
				FlexLayoutModule,

				CheckboxModule,
				FeedbackDialogModule,
				EventSignUpDialogModule,
				EventCheckoutDialogModule,
				GoogleMapsDialogModule,
				LoadingModule,
			],
	providers: [WindowService, EventService],
	entryComponents: []
})
export class EventCalendarItemModule {

}
