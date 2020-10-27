import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExpandableInputModule } from '@app-directives/expandable/expandable-input/expandable-input.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { LinkingDialogModule } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { ContentEditableModule } from '@app-directives/content-editable/content-editable.module';
import { TextToolModule } from '@app-directives/text-tool/text-tool.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DesignDialogModule } from '@app-dialogs/design-dialog/design-dialog.module';
import { ImageDialogModule } from '@app-dialogs/image-dialog/image-dialog.module';
import { NavigationDialogComponent } from '@app-dialogs/navigation-dialog/navigation-dialog.component';
import { NavigationThemeModule } from '@app-dialogs/navigation-dialog/navigation-theme/navigation-theme.module';

export { NavigationDialogComponent } from '@app-dialogs/navigation-dialog/navigation-dialog.component';

@NgModule({
	declarations: [NavigationDialogComponent],
	exports: [NavigationDialogComponent],
	imports: [
		CommonModule, ReactiveFormsModule,
		RadioGroupModule, ExpandableInputModule,
		SliderModule, DraggableListInlineModule,
		DropDownModule, DraggableListModule,
		DesignDialogModule, ImageDialogModule,
		LinkingDialogModule, ContentEditableModule,
		TextToolModule,
		NavigationThemeModule],
	entryComponents: [NavigationDialogComponent],
	providers: []
})
export class NavigationDialogModule { }
