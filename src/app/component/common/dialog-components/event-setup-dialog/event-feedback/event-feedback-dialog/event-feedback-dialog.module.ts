import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
// import { SurveyDialogModule } from '@app-dialogs/survey-dialog/survey-dialog.module';
import { ItemModule } from '@app-items/item.module';

import { EventFeedbackDialogComponent } from './event-feedback-dialog.component';

import { WindowService } from '@app-common/window/window.service';
@NgModule({
	declarations: [ EventFeedbackDialogComponent ],
	exports: [ EventFeedbackDialogComponent ],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		CheckboxModule,
		// SurveyDialogModule,
		ItemModule
	],
	providers: [WindowService],
	entryComponents: [
		EventFeedbackDialogComponent
	]
})
export class EventFeedbackDialogModule {}
