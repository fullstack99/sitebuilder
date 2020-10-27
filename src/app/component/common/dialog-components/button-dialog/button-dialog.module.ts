import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExpandableInputModule } from '@app-directives/expandable/expandable-input/expandable-input.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { ButtonDialogComponent } from '@app-dialogs/button-dialog/button-dialog.component';
export { ButtonDialogComponent } from '@app-dialogs/button-dialog/button-dialog.component';

@NgModule({
	declarations: [ButtonDialogComponent],
	exports: [ButtonDialogComponent],
	imports: [
		CommonModule, ReactiveFormsModule,
		RadioGroupModule, CheckboxModule,
		ExpandableInputModule, SliderModule,
		DraggableListInlineModule, DraggableListModule,
		TextEditorTinyMceModule, FeedbackDialogModule],

	entryComponents: [ButtonDialogComponent],
	providers: []
})
export class ButtonDialogModule { }
