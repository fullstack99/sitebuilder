import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { RegisterFormModule } from '@app-ui/register-form/register-form.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { AccountSettingDialogComponent } from '@app-dialogs/account-setting-dialog/account-setting-dialog.component';
import { ProfileComponent } from '@app-dialogs/account-setting-dialog/profile/profile.component';

@NgModule({
    declarations: [
        AccountSettingDialogComponent,
        ProfileComponent
    ],
    imports: [
        SharedModule,
        RegisterFormModule,
        DropDownModule,
        DateTimeModule,
        RadioGroupModule,
        SplitTextBoxModule,
        ImageImportDialogModule,
        ImageEditorModule,
        FeedbackDialogModule
    ],
    entryComponents: [
        AccountSettingDialogComponent,
        ProfileComponent
    ],
    providers:[]
})
export class AccountSettingDialogModule {}
