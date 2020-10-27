import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { DropDownModule } from "@app-ui/drop-down-menu/drop-down.module";
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { AddListModule } from '@app-dialogs/add-list/add-list.module';
import { AddContactComponent } from '@app-common/email-list/add-contact/add-contact.component';
import { WindowService } from '@app-common/window/window.service';
export { AddContactComponent } from '@app-common/email-list/add-contact/add-contact.component';

@NgModule({
	declarations: [
		AddContactComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		AttentionDialogModule,
		FeedbackDialogModule,
		DropDownModule,
		LoadingModule,		
		AddListModule,
		SplitTextBoxModule,		
		TooltipModule
	],
	exports: [
		AddContactComponent
	],
	entryComponents: [AddContactComponent],
	providers      : [WindowService]
})
export class AddContactModule {}
