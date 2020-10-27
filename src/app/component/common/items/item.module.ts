import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { ClickOutsideModule } from 'ng-click-outside';

import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { LinkAnswerDialogModule } from '@app-dialogs/link-answer-dialog/link-answer-dialog.module';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DraggableModule } from '@app-directives/draggable/draggable.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { ResizableModule } from '@app-directives/resizable/resizable.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { TimePickerModule } from '@app-ui/time-picker/time-picker.module';
import { TreeModule } from '@app-common/tree/tree.module';

import { GlogoodContentEditableModule } from '@app-ui/glogood-content-editable/glogood-content-editable.module';
import { AutosizeModule } from '@app-common/directives';
import { ContentEditableModule } from '@app-directives/content-editable/content-editable.module';
import { RotatableModule } from '@app-directives/rotatable/rotatable.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';

import { ButtonItemModule } from '@app-items/button/button-item.module';
import { DropdownItemModule } from '@app-items/dropdown/dropdown.module';
import { EcommerceItemModule } from '@app-items/ecommerce-item/ecommerce-item.module';
import { ImageItemModule } from '@app-items/image/image-item.module';
import { GalleryItemModule } from '@app-items/gallery/gallery-item.module';
import { ShapeItemModule } from '@app-items/shape/shape-item.module';
import { SlideshowItemModule } from '@app-items/slideshow/slideshow-item.module';
import { SocialItemModule } from '@app-items/social/social-item.module';
import { TextItemModule } from '@app-items/text/text-item.module';
import { VideoItemModule } from '@app-items/video/video-item.module';
import { DonationItemModule } from '@app-items/donation/donation-item.module';
import { EventSetupItemModule } from '@app-items/event-setup/event-setup-item.module';
import { EventCalendarItemModule } from '@app-items/event-calendar/event-calendar-item.module';
import { PhotoItemModule } from '@app-items/photo/photo-item.module';
import { BlogFooterItemModule } from '@app-items/blog-footer/blog-footer.module';
import { AppointmentItemModule } from '@app-items/appointment/appointment-item.module';

import { ItemComponent } from '@app-items/item.component';
import { ItemGroupComponent } from '@app-items/item-group/item-group.component';
import { NavComponent } from '@app-items/nav/nav.component';

import { SingleTextComponent } from '@app-items/single-text/single-text.component';
import { SingleCheckComponent } from '@app-items/single-check/single-check.component';
import { SingleDateComponent } from '@app-items/single-date/single-date.component';
import { MultipleChoiceComponent } from '@app-items/multiple-choice/multiple-choice.component';
import { MultipleChoiceResultComponent } from '@app-items/multiple-choice-result/multiple-choice-result.component';
import { FormGroupComponent } from '@app-items/form-group/form-group.component';
import { RatingComponent } from '@app-items/rating/rating.component';
import { EndSurveyComponent } from '@app-items/end-survey/end-survey.component';
import { MatrixChoiceComponent } from '@app-items/matrix-choice/matrix-choice.component';
import { RankComponent } from '@app-items/rank/rank.component';
import { SurveyComponent } from '@app-items/survey/survey.component';
import { QuestionComponent } from '@app-items/survey/question/question.component';
import { DateComponent } from '@app-items/date/date.component';
import { TimeComponent } from '@app-items/time/time.component';
import { SurveyCommentComponent } from '@app-items/survey-comment/survey-comment.component';
import { SurveyMultiChoiceComponent } from '@app-items/survey-multi-choice/survey-multi-choice.component';
import { SurveySingleTextComponent } from '@app-items/survey-single-text/survey-single-text.component';
import { SurveyMultiTextsComponent } from '@app-items/survey-multi-texts/survey-multi-texts.component';
import { SitemapItemComponent } from '@app-items/sitemap-item/sitemap-item.component';
@NgModule({
	declarations: [
		ItemComponent,
			ItemGroupComponent,
			NavComponent,

			SingleTextComponent,
			SingleCheckComponent,
			SingleDateComponent,
			MultipleChoiceComponent,
			MultipleChoiceResultComponent,
			FormGroupComponent,
			RatingComponent,
			EndSurveyComponent,
			MatrixChoiceComponent,
			RankComponent,
			SurveyComponent,
			QuestionComponent,
			DateComponent,
			TimeComponent,
			SurveyCommentComponent,
			SurveyMultiChoiceComponent,
			SurveySingleTextComponent,
			SurveyMultiTextsComponent,
	  		SitemapItemComponent
		],
	exports: [ItemComponent],
	imports: [
			CommonModule,
			FormsModule,
			ReactiveFormsModule,
			ClickOutsideModule,
			AttentionDialogModule,
			BackgroundModule,
			BorderModule,
			DraggableModule,
			DraggableListInlineModule,
			DraggableListModule,
			DropDownModule,
			ResizableModule,
			RotatableModule,
			SortableModule,
			SliderModule,
			TextEditorTinyMceModule,
			DateTimeModule,
			TimePickerModule,
			AutosizeModule,
			ContentEditableModule,
			ImageEditorModule,
			GlogoodContentEditableModule,
			TreeModule,

			ButtonItemModule,
			DropdownItemModule,
			ImageItemModule,
			GalleryItemModule,
			ShapeItemModule,
			SlideshowItemModule,
			TextItemModule,
			VideoItemModule,
			EcommerceItemModule,
			SocialItemModule,
			DonationItemModule,
			EventSetupItemModule,
			EventCalendarItemModule,
			PhotoItemModule,
			BlogFooterItemModule,
	  		AppointmentItemModule,

	  		LinkAnswerDialogModule
		],
	entryComponents: [ItemComponent],
	providers: []
})
export class ItemModule {}
