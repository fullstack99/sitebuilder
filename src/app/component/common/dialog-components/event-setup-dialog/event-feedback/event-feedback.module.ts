import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { EventFeedbackDialogModule } from './event-feedback-dialog/event-feedback-dialog.module';
// import { ItemModule } from '@app-items/item.module';
import { EventFeedbackComponent } from './event-feedback.component';

import { WindowService } from '@app-common/window/window.service';

@NgModule({
	declarations: [ EventFeedbackComponent ],
	exports: [ EventFeedbackComponent ],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		CheckboxModule,
		EventFeedbackDialogModule,
		// ItemModule
	],
	providers: [WindowService]
})
export class EventFeedbackModule {}
