import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { CommentSetupComponent } from '@app-items/blog-footer/comment-setup/comment-setup.component';

@NgModule({
    declarations   : [CommentSetupComponent],
    exports        : [CommentSetupComponent],
    imports        : [CommonModule, ReactiveFormsModule, FeedbackDialogModule, RadioGroupModule],
    entryComponents: [CommentSetupComponent],
    providers      : []
})
export class CommentSetupModule {}
