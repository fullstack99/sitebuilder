import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogComponent } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

export { FeedbackDialogComponent } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

@NgModule({
    declarations   : [FeedbackDialogComponent],
    exports        : [FeedbackDialogComponent],
    imports        : [SharedModule, CheckboxModule, LoadingModule],
    entryComponents: [FeedbackDialogComponent],
    providers      : []
})
export class FeedbackDialogModule {}
