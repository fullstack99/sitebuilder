import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { ArrowButtonModule } from '@app-ui/arrow-button/arrow-button.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { AddListModule } from '@app-dialogs/add-list/add-list.module';

import { ContactDetailsComponent } from '@app-common/email-list/contact-details/contact-details.component';
export { ContactDetailsComponent } from '@app-common/email-list/contact-details/contact-details.component';

@NgModule({
    declarations   : [ContactDetailsComponent],
    exports        : [ContactDetailsComponent],
    imports        : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ArrowButtonModule,
        CheckboxModule,
        DropDownModule,
        FeedbackDialogModule,
        SplitTextBoxModule,
        AddListModule
    ],
    entryComponents: [ContactDetailsComponent],
    providers      : []
})
export class ContactDetailsModule {}
