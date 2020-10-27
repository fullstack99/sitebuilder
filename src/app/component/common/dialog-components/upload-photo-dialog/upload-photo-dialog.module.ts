import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FileDropModule } from 'ngx-file-drop';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { MultiListBoxModule } from '@app-common/multi-list-box/multi-list-box.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';

import { UploadPhotoDialogComponent } from '@app-dialogs/upload-photo-dialog/upload-photo-dialog.component';

export { UploadPhotoDialogComponent } from '@app-dialogs/upload-photo-dialog/upload-photo-dialog.component';

@NgModule({
    declarations   : [UploadPhotoDialogComponent],
    exports        : [UploadPhotoDialogComponent],
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        FileDropModule, 
        ImageEditorModule,        
        FeedbackDialogModule,        
        MultiListBoxModule,
        TooltipModule
    ],
	entryComponents: [UploadPhotoDialogComponent],
    providers      : []
})
export class UploadPhotoDialogModule {}
