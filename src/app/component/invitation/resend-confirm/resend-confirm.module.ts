import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ResendConfirmDialogComponent } from '@app/component/invitation/resend-confirm/resend-confirm.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,		
		FeedbackDialogModule
	],
	exports: [
		ResendConfirmDialogComponent
	],
	entryComponents: [
		ResendConfirmDialogComponent
	],
	declarations: [ResendConfirmDialogComponent]
})
export class ResendConfirmDialogModule { }
