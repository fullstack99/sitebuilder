import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FileDropModule } from 'ngx-file-drop';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
//import { LinkingDialogModule, LinkingDialogComponent } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';

import { WatermarkDialogComponent } from '@app-dialogs/watermark-dialog/watermark-dialog.component';

export { WatermarkDialogComponent } from '@app-dialogs/watermark-dialog/watermark-dialog.component';

@NgModule({
    declarations   : [WatermarkDialogComponent],
    exports        : [WatermarkDialogComponent],
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        FileDropModule, 
        ImageEditorModule,
        ImageImportDialogModule,
        FeedbackDialogModule,
        TextEditorTinyMceModule],
	entryComponents: [WatermarkDialogComponent],
    providers      : []
})

export class WatermarkDialogModule {}
