import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddFontSizeDialogModule } from '@app-dialogs/add-fontsize-dialog/add-fontsize-dialog.module';
import { TextEditorTinyMceDirective } from '@app-directives/text-editor-tinymce/text-editor-tinymce.directive';

@NgModule({
    declarations: [TextEditorTinyMceDirective],
    exports     : [TextEditorTinyMceDirective],
    imports     : [CommonModule, AddFontSizeDialogModule],
    providers   : []
})
export class TextEditorTinyMceModule {}
