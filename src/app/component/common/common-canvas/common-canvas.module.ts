import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { ItemModule } from '@app-items/item.module';
import { ContextMenuModule } from '@app-directives/context-menu/context-menu.module';
import { DraggableModule } from '@app-directives/draggable/draggable.module';
import { ResizableModule } from '@app-directives/resizable/resizable.module';
import { RotatableModule } from '@app-directives/rotatable/rotatable.module';
import { ColorPickerModule, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.module';
import { FontPickerModule, FontPickerDialogComponent } from '@app-dialogs/font-picker/font-picker.module';

import { BackgroundDialogModule } from '@app-dialogs/background-dialog/background-dialog.module';
import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderDialogModule } from '@app-dialogs/border-dialog/border-dialog.module';
import { ButtonDialogModule } from '@app-dialogs/button-dialog/button-dialog.module';
import { ImageEditorModule, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.module';
import { GalleryDialogModule } from '@app-dialogs/gallery-dialog/gallery-dialog.module';
import { LinkingDialogModule } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { NavigationDialogModule } from '@app-dialogs/navigation-dialog/navigation-dialog.module';
import { ShapeDialogModule } from '@app-dialogs/shape-dialog/shape-dialog.module';
import { SlideshowDialogModule } from '@app-dialogs/slideshow-dialog/slideshow-dialog.module';
import { VideoDialogModule } from '@app-dialogs/video-dialog/video-dialog.module';
import { SkippingDialogModule } from '@app-dialogs/skipping-dilaog/skipping-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { WindowService } from '@app-common/window/window.service';
import { FontsService } from '@app-dialogs/font-picker/fonts.service';
import { ElementSelectorModule } from '@app-directives/element-selector/element-selector.module';
import { RulerOverlayModule } from '@app-ui/ruler-overlay/ruler-overlay.module';
import { CommonCanvasComponent } from '@app-common/common-canvas/common-canvas.component';

@NgModule({
	declarations: [
		CommonCanvasComponent
	],
	exports: [CommonCanvasComponent],
	imports: [
		CommonModule,
		DraggableModule,
		ResizableModule,
		RotatableModule,
		ContextMenuModule,
		HttpModule,
		ColorPickerModule,
		FontPickerModule,
		LoadingModule,

		RulerOverlayModule,
		ElementSelectorModule,

		ItemModule,
		LinkingDialogModule,
		BackgroundDialogModule,
		BorderDialogModule,
		ButtonDialogModule,
		ImageEditorModule,
		GalleryDialogModule,
		NavigationDialogModule,
		ShapeDialogModule,
		SlideshowDialogModule,
		VideoDialogModule,
		SkippingDialogModule,			   
		
		BackgroundModule
	],
	entryComponents: [		
		FontPickerDialogComponent,
		ColorPickerComponent,
		ImageEditorComponent
	],
	providers: [		
		WindowService,
		FontsService		
	]
})

export class CommonCanvasModule {}
