import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { SliderModule } from '@app-ui/slider/slider.module';
import { ImageImportDialogModule } from "@app-dialogs/image-import-dialog/image-import-dialog.module";
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ImageDialogComponent } from '@app-dialogs/image-dialog/image-dialog.component';

export { ImageDialogComponent } from '@app-dialogs/image-dialog/image-dialog.component';

@NgModule({
	declarations: [ImageDialogComponent],
	imports: [
			CommonModule, ReactiveFormsModule, 
			HttpModule, SliderModule, 
			ImageImportDialogModule,
			FeedbackDialogModule],
	entryComponents: [ImageDialogComponent],
	providers: []
})
export class ImageDialogModule { }
