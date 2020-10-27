import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddFontSizeDialogModule } from '@app-dialogs/add-fontsize-dialog/add-fontsize-dialog.module';
import { TextAreaToolDirective } from './text-area-tool.directive';

@NgModule({
    declarations: [TextAreaToolDirective],
    exports     : [TextAreaToolDirective],
    imports     : [CommonModule, AddFontSizeDialogModule],
    providers   : []
})
export class TextAreaToolModule {}
