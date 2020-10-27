import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DateTimeRangeModule } from '@app-ui/datetime-range/datetime-range.module';
import { LoadingModule } from '@app-ui/loading/loading.module';

import { EventInfoModule } from './event-info/event-info.module';
import { EventActivitiesModule } from './event-activities/event-activities.module';
import { EventContactInfoModule } from './event-contact-info/event-contact-info.module';
import { EventFeedbackModule } from './event-feedback/event-feedback.module';

import { EventService } from '@app/services/event.service';
import { WindowService } from '@app-common/window/window.service';

import { EventSetupDialogComponent } from './event-setup-dialog.component';


@NgModule({
	declarations: [
		EventSetupDialogComponent
	],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		CheckboxModule,
		DraggableListModule,
		DateTimeRangeModule,
		EventInfoModule,
		EventActivitiesModule,
		EventContactInfoModule,
		EventFeedbackModule,
		RadioGroupModule,
		SplitTextBoxModule,
		LoadingModule
	],
	providers: [
		EventService,
		WindowService
	],
	entryComponents: [
		EventSetupDialogComponent
	]
})
export class EventSetupDialogModule {}
