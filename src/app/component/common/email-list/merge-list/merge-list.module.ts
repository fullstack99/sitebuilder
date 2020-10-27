import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { MergeListComponent } from '@app-common/email-list/merge-list/merge-list.component';
export { MergeListComponent } from '@app-common/email-list/merge-list/merge-list.component';

@NgModule({
    declarations   : [MergeListComponent],
    exports        : [MergeListComponent],
    imports        : [CommonModule, FormsModule, ReactiveFormsModule, CheckboxModule, FeedbackDialogModule],
    entryComponents: [MergeListComponent],
    providers      : []
})
export class MergeListModule {}
