import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SocialBarComponent } from '@app-dialogs/social-bar/social-bar.component';
import { FeedbackDialogModule, FeedbackDialogComponent } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

export { SocialBarComponent } from '@app-dialogs/social-bar/social-bar.component';

@NgModule({
    declarations   : [SocialBarComponent],
    exports        : [SocialBarComponent],
    imports        : [CommonModule, ReactiveFormsModule, FeedbackDialogModule, RadioGroupModule],
    entryComponents: [SocialBarComponent],
    providers      : []
})
export class SocialBarModule {}
