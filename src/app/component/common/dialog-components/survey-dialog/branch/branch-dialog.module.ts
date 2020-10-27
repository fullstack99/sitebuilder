import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { BranchDialogComponent } from '@app-dialogs/survey-dialog/branch/branch-dialog.component';

export { BranchDialogComponent } from '@app-dialogs/survey-dialog/branch/branch-dialog.component';

@NgModule({
	declarations: [ BranchDialogComponent ],
	exports: [ BranchDialogComponent ],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		RadioGroupModule,
		FeedbackDialogModule		       
		],
	entryComponents: [ BranchDialogComponent ]
})
export class BranchDialogModule { }
