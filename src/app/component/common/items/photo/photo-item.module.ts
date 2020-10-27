import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { WatermarkDialogModule } from '@app-dialogs/watermark-dialog/watermark-dialog.module';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { PhotoItemComponent } from '@app-items/photo/photo.component';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
	direction: 'horizontal',
	slidesPerView: 'auto'
};

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		SwiperModule, 
		ImageEditorModule,
		SplitTextBoxModule,
		SortableModule,
		TooltipModule,
		TextEditorTinyMceModule,
		WatermarkDialogModule 
	],
	declarations: [ PhotoItemComponent ],
	exports: [ PhotoItemComponent ],
	providers: [ 
		WindowService,
		{
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
	],
	entryComponents: [ PhotoItemComponent ]
})

export class PhotoItemModule {
}
