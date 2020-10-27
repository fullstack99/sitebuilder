import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DateTimeRangeModule } from '@app-ui/datetime-range/datetime-range.module';

import { QualifyParticipantDialogModule } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.module';
import { EventActivitiesComponent } from '@app-dialogs/event-setup-dialog/event-activities/event-activities.component';
import { EventActivityComponent } from '@app-dialogs/event-setup-dialog/event-activities/event-activity/event-activity.component';
import { EventAdmissionComponent } from '@app-dialogs/event-setup-dialog/event-activities/event-admission/event-admission.component';
import { EventFeeComponent } from '@app-dialogs/event-setup-dialog/event-activities/event-fee-early-bird/event-fee-early-bird.component';
import { EventMessageComponent } from '@app-dialogs/event-setup-dialog/event-activities/event-message/event-message.component';
import { ParticipantTypeComponent } from '@app-dialogs/event-setup-dialog/event-activities/participant-type/participant-type.component';

@NgModule({
	declarations: [
		EventActivitiesComponent, EventActivityComponent, EventAdmissionComponent,
		EventFeeComponent, EventMessageComponent, ParticipantTypeComponent ],
	exports: [ EventActivitiesComponent ],
	imports: [
		CommonModule,
		ReactiveFormsModule,

		RadioGroupModule,
		SplitTextBoxModule,
		DraggableListModule,
		DateTimeModule,
		DateTimeRangeModule,
		QualifyParticipantDialogModule
	],
	entryComponents: [ EventMessageComponent, EventFeeComponent ],
	providers: []
})
export class EventActivitiesModule {}
