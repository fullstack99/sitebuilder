import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { EventSignUpDialogComponent } from './event-signup-dialog.component';

@NgModule({
	declarations: [
		EventSignUpDialogComponent
	],
	exports: [ EventSignUpDialogComponent ],
	imports: [ 
		SharedModule,
		FeedbackDialogModule,
		LoadingModule,
		SplitTextBoxModule,
	],
	providers: [
	],
	entryComponents: [
		EventSignUpDialogComponent
	]
})
export class EventSignUpDialogModule {}
