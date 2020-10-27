import { NgModule } from "@angular/core";
import { SharedModule } from '@app-shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { TermsPolicyComponent } from "./terms-policy.component";

@NgModule({
  imports: [
    SharedModule,
		FeedbackDialogModule,
  ],
  exports: [TermsPolicyComponent],
  declarations: [TermsPolicyComponent],
  entryComponents: [TermsPolicyComponent],
	providers: []
})
export class TermsPolicyModule {}
