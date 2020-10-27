import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RotatableModule } from '@app-directives/rotatable/rotatable.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LinkItemModule } from '@app-items/link-item.module';
import { PickItemDialogComponent } from '@app-dialogs/linking-dialog/pick-item-dialog.component';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';
@NgModule({
	declarations   : [PickItemDialogComponent],
	exports		: [PickItemDialogComponent],
	imports		: [
		CommonModule,
		ReactiveFormsModule,
		FeedbackDialogModule,
		LinkItemModule,
		RotatableModule,

		BackgroundModule,
		BorderModule,
	],
	entryComponents: [PickItemDialogComponent],
	providers	  : []
})
export class PickItemDialogModule {}
