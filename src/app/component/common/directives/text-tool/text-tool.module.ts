import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddFontSizeDialogModule } from '@app-dialogs/add-fontsize-dialog/add-fontsize-dialog.module';
import { TextToolDirective } from '@app-directives/text-tool/text-tool.directive';

@NgModule({
    declarations: [TextToolDirective],
    exports     : [TextToolDirective],
    imports     : [CommonModule, AddFontSizeDialogModule],
    providers   : []
})
export class TextToolModule {}
