import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SimpleFormDialogComponent } from '@app-dialogs/simple-form/simple-form.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		CheckboxModule,
		FeedbackDialogModule
	],
	exports: [
		SimpleFormDialogComponent
	],
	entryComponents: [
		SimpleFormDialogComponent
	],
	declarations: [SimpleFormDialogComponent]
})
export class SimpleFormDialogModule { }
