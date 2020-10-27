import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { BorderDialogComponent } from '@app-dialogs/border-dialog/border-dialog.component';
export { BorderDialogComponent } from '@app-dialogs/border-dialog/border-dialog.component';

@NgModule({
	declarations: [BorderDialogComponent],
	exports: [BorderDialogComponent],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RadioGroupModule,
		CheckboxModule,
		SliderModule,
		DraggableListInlineModule,
		DraggableListModule,
		FeedbackDialogModule],

	entryComponents: [BorderDialogComponent],
	providers: []
})
export class BorderDialogModule { }
