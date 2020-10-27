import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { AttentionDialogComponent } from '@app-dialogs/attention-dialog/attention-dialog.component';

@NgModule({
	declarations: [AttentionDialogComponent],
	exports: [AttentionDialogComponent],
	imports: [
		SharedModule,		
		FeedbackDialogModule],
	entryComponents: [AttentionDialogComponent],
	providers: []
})
export class AttentionDialogModule { }
