import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';

import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { AccountAccessDialogComponent } from './account-access-dialog.component';

export { AccountAccessDialogComponent } from './account-access-dialog.component';

@NgModule({
  imports: [
    SharedModule,
    CheckboxModule,
    DropDownModule,
    FeedbackDialogModule
  ],
  declarations: [AccountAccessDialogComponent],
  exports: [AccountAccessDialogComponent],
  entryComponents: [AccountAccessDialogComponent]
})
export class AccountAccessDialogModule { }
