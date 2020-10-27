import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { FAQDialogComponent } from './faq-dialog.component';

export { FAQDialogComponent } from './faq-dialog.component';

@NgModule({
  imports: [
    SharedModule,
    CheckboxModule,
    FeedbackDialogModule,
    LoadingModule
  ],
  declarations: [FAQDialogComponent],
  exports: [FAQDialogComponent],
  entryComponents: [FAQDialogComponent]
})
export class FAQDialogModule { }
