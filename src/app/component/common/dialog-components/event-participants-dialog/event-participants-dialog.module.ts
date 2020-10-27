import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { EventParticipantsDialogComponent } from './event-participants-dialog.component';

@NgModule({
	declarations: [
		EventParticipantsDialogComponent
	],
	exports: [ EventParticipantsDialogComponent ],
	imports: [
		SharedModule,
		FeedbackDialogModule,
		LoadingModule,
		SplitTextBoxModule,
	],
	providers: [
	],
	entryComponents: [
		EventParticipantsDialogComponent
	]
})
export class EventParticipantsDialogModule {}
