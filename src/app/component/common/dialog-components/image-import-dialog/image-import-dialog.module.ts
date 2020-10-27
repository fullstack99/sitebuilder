import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FileDropModule } from 'ngx-file-drop';

import { ImageEditorModule, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.module';
import { UploadPhotoDialogModule } from '@app-dialogs/upload-photo-dialog/upload-photo-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ImageImportDialogComponent } from '@app-dialogs/image-import-dialog/image-import-dialog.component';

export { ImageImportDialogComponent } from '@app-dialogs/image-import-dialog/image-import-dialog.component';

@NgModule({
	declarations: [ImageImportDialogComponent],
	exports: [ImageImportDialogComponent],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FileDropModule,
		ImageEditorModule,
		FeedbackDialogModule,
		LoadingModule,
		UploadPhotoDialogModule
	],
	entryComponents: [ImageImportDialogComponent],
	providers: []
})
export class ImageImportDialogModule { }
