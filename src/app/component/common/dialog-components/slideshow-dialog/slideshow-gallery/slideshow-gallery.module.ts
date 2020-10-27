import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlideshowGalleryComponent } from '@app-dialogs/slideshow-dialog/slideshow-gallery/slideshow-gallery.component';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { LinkingDialogModule } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { LoadingModule } from '@app-ui/loading/loading.module';

@NgModule({
	declarations: [SlideshowGalleryComponent],
	exports: [SlideshowGalleryComponent],
	imports: [
		CommonModule,
		ImageEditorModule,
		LinkingDialogModule,
		DraggableListInlineModule,
		ImageImportDialogModule,
		LoadingModule
	],
	providers: [],
	entryComponents: [SlideshowGalleryComponent]
})
export class SlideshowGalleryModule {}
