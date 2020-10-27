import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { OrderModule } from 'ngx-order-pipe';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { OptionLookUpComponent } from './option-lookup.component';

@NgModule({
	declarations: [OptionLookUpComponent],
	exports: [OptionLookUpComponent],
	imports: [
		SharedModule,
		OrderModule,
		AttentionDialogModule,
		FeedbackDialogModule,
		LoadingModule,
		RadioGroupModule
	],
	providers: [],
	entryComponents: [OptionLookUpComponent]
})
export class OptionLookUpModule {}
