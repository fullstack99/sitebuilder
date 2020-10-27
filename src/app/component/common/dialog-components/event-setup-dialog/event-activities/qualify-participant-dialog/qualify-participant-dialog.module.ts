import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';

import { QualifyParticipantDialogComponent } from './qualify-participant-dialog.component';

export { QualifyParticipantDialogComponent } from './qualify-participant-dialog.component';

@NgModule({
	declarations: [QualifyParticipantDialogComponent],
	imports: [
		SharedModule,
		FeedbackDialogModule,
		CheckboxModule,
	],
	entryComponents: [
		QualifyParticipantDialogComponent
	],
	providers: []
})
export class QualifyParticipantDialogModule { }
