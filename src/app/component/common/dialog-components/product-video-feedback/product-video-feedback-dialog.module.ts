import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { CommonCanvasModule } from '@app-common/common-canvas/common-canvas.module';

import { ProductVideoFeedbackDialogComponent } from './product-video-feedback-dialog.component';

@NgModule({
	declarations: [ ProductVideoFeedbackDialogComponent ],
	exports: [ ProductVideoFeedbackDialogComponent ],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		FeedbackDialogModule,
		CommonCanvasModule,
		LoadingModule
	],
	entryComponents: [ ProductVideoFeedbackDialogComponent ],
	providers: [
	]
})
export class ProductVideoFeedbackDialogModule { }
