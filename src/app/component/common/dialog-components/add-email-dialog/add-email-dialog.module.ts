import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';

import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { EmailSentDialogModule } from '@app-dialogs/email-sent-dialog/email-sent-dialog.module';

import { AddEmailDialogComponent } from './add-email-dialog.component';


@NgModule({
	imports: [
		SharedModule,
		CheckboxModule,
		DropDownModule,
		FeedbackDialogModule,
		EmailSentDialogModule
	],
	declarations: [AddEmailDialogComponent],
	exports: [AddEmailDialogComponent],
	entryComponents: [AddEmailDialogComponent]
})
export class AddEmailDialogModule { }
