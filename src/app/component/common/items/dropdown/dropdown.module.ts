import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { TextToolModule } from '@app-directives/text-tool/text-tool.module';
import { ContentEditableModule } from '@app-directives/content-editable/content-editable.module';
import { DropdownItemComponent } from '@app-items/dropdown/dropdown.component';

@NgModule({
	imports: [
		CommonModule,
		DraggableListModule,
		DraggableListInlineModule,
		DropDownModule,
		TextEditorTinyMceModule,
		TextToolModule
	],
	exports: [DropdownItemComponent],
	declarations: [DropdownItemComponent]
})
export class DropdownItemModule { }
