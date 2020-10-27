import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { TooltipFormModule } from '@app-ui/tooltip-form/tooltip-form.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { ItemOptionsModule } from '@app/component/ecommerce/items/new-item/item-options/item-options.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { TagsInputModule } from '@app-ui/tags-input/tags-input.module';
import { ClearableInputModule } from '@app-ui/clearable-input/clearable-input.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SlideshowGalleryModule } from '@app-dialogs/slideshow-dialog/slideshow-gallery/slideshow-gallery.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { FontPickerDialogComponent, FontPickerModule } from '@app-dialogs/font-picker/font-picker.module';
import { ColorPickerModule, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.module';
import { ExpandableInputModule } from '@app-directives/expandable/expandable-input/expandable-input.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { OptionLookUpModule } from './item-options/option-lookup/option-lookup.module';
import { ItemKeywordsLookupModule } from './item-keys/item-keywords-lookup.module';
import { NewEcommerceItemComponent } from '@app/component/ecommerce/items/new-item/new-item.component';

@NgModule({
	declarations: [
		NewEcommerceItemComponent
	],
	exports: [NewEcommerceItemComponent],
	imports: [
		SharedModule,
		DropDownModule,
		RadioGroupModule,
		DateTimeModule,
		ItemOptionsModule,
		LoadingModule,
		SplitTextBoxModule,
		TooltipModule,
		TagsInputModule,
		ClearableInputModule,
		TooltipFormModule,
		FeedbackDialogModule,
		SlideshowGalleryModule,
		TextEditorTinyMceModule,
		FontPickerModule,
		ColorPickerModule,
		DraggableListModule,
		DraggableListInlineModule,
		ExpandableInputModule,
		OptionLookUpModule,
		ItemKeywordsLookupModule
	],
	providers: [],
	entryComponents: [
		NewEcommerceItemComponent,
		FontPickerDialogComponent,
		ColorPickerComponent
	]
})
export class NewEcommerceItemModule {}
