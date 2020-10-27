import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ResizableModule } from '@app-directives/resizable/resizable.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { WindowService } from '@app-common/window/window.service';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { EventActivitiesModule } from '@app-dialogs/event-setup-dialog/event-activities/event-activities.module';
import { EventSignUpDialogModule } from '@app-dialogs/event-signup-dialog/event-signup-dialog.module';
import { EventCheckoutDialogModule } from '@app-dialogs/event-checkout-dialog/event-checkout-dialog.module';
import { EventParticipantsDialogModule } from '@app-dialogs/event-participants-dialog/event-participants-dialog.module';

import { EventSetupItemComponent } from './event-setup.component';

@NgModule({
	declarations: [ EventSetupItemComponent ],
	exports: [ EventSetupItemComponent ],
	imports: [  CommonModule,
				FormsModule,
				ReactiveFormsModule,
				FlexLayoutModule,
				FeedbackDialogModule,
				ResizableModule,
				CheckboxModule,
				DropDownModule,
				SplitTextBoxModule,
				EventActivitiesModule,
				GoogleMapsDialogModule,
				EventSignUpDialogModule,
				EventCheckoutDialogModule,
				EventParticipantsDialogModule
			],
	providers: [WindowService],
	entryComponents: []
})
export class EventSetupItemModule {
}
