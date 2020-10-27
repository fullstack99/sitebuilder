import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { FontPickerDialogComponent } from '@app-dialogs/font-picker/font-picker.component';
import { FontsService } from '@app-dialogs/font-picker/fonts.service';

export { FontPickerDialogComponent } from '@app-dialogs/font-picker/font-picker.component';

@NgModule({
    declarations: [FontPickerDialogComponent],
    exports     : [FontPickerDialogComponent],
    imports     : [CommonModule, ReactiveFormsModule, FeedbackDialogModule],
    providers   : [FontsService],
    entryComponents: [FontPickerDialogComponent]
})
export class FontPickerModule {}
