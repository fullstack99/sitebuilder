import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { LinkingDialogModule } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { TextToolModule } from '@app-directives/text-tool/text-tool.module';
import { GalleryDialogComponent } from '@app-dialogs/gallery-dialog/gallery-dialog.component';
import { GalleryThemesComponent } from '@app-dialogs/gallery-dialog/themes/themes.component';
import { GalleryService } from '@app-dialogs/gallery-dialog/gallery.service';

export { GalleryDialogComponent } from '@app-dialogs/gallery-dialog/gallery-dialog.component';

@NgModule({
	declarations: [ GalleryDialogComponent, GalleryThemesComponent],
	exports: [ GalleryDialogComponent, GalleryThemesComponent ],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		SortableModule,
		DraggableListInlineModule,
		DraggableListModule,
		DropDownModule,
		FeedbackDialogModule,
		ImageEditorModule,
		ImageImportDialogModule,
		LinkingDialogModule,
		LoadingModule,
		SliderModule,
		TextEditorTinyMceModule,
		TextToolModule
	],
	entryComponents: [ GalleryDialogComponent ],
	providers: [ GalleryService ]
})
export class GalleryDialogModule { }
