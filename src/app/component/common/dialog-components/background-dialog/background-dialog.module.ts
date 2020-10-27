import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { BackgroundModule } from '@app-directives/background/background.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { BackgroundDialogComponent } from '@app-dialogs/background-dialog/background-dialog.component';

export { BackgroundDialogComponent } from '@app-dialogs/background-dialog/background-dialog.component';

@NgModule({
	declarations: [BackgroundDialogComponent],
	exports: [BackgroundDialogComponent],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		AttentionDialogModule,
		BackgroundModule,
		CheckboxModule,
		DraggableListInlineModule,
		DraggableListModule,
		DropDownModule,
		FeedbackDialogModule,
		ImageImportDialogModule,
		ImageEditorModule,
		LoadingModule,
		RadioGroupModule,
		SliderModule,
		TooltipModule,
		MenubarModule
	],
	entryComponents: [BackgroundDialogComponent],
	providers: [			
	]
})
export class BackgroundDialogModule { }
