import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { InviteSetupDialogComponent } from '@app-dialogs/invite-setup-dialog/invite-setup-dialog.component';

export { InviteSetupDialogComponent } from '@app-dialogs/invite-setup-dialog/invite-setup-dialog.component';

@NgModule({
    declarations: [InviteSetupDialogComponent],
    exports: [InviteSetupDialogComponent],
    imports: [ CommonModule,
            FormsModule,
            ReactiveFormsModule,
            AttentionDialogModule,
            CheckboxModule,            
            DateTimeModule,            
            FeedbackDialogModule,
            SplitTextBoxModule,
            TextEditorTinyMceModule
        ],
    entryComponents: [InviteSetupDialogComponent],
    providers: []
})
export class InviteSetupDialogModule {}
