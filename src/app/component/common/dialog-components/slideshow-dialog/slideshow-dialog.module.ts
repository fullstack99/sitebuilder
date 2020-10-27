import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { SliderModule } from '@app-ui/slider/slider.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { LinkingDialogModule } from '@app-dialogs/linking-dialog/linking-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SlideshowDialogComponent } from '@app-dialogs/slideshow-dialog/slideshow-dialog.component';

export { SlideshowDialogComponent } from '@app-dialogs/slideshow-dialog/slideshow-dialog.component';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 3  
};

@NgModule({
    declarations   : [SlideshowDialogComponent],
    exports        : [SlideshowDialogComponent],
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        SwiperModule,
        SliderModule,
        ImageEditorModule,
        ImageImportDialogModule,        
        DraggableListInlineModule,
        FeedbackDialogModule,
        LinkingDialogModule,
        LoadingModule
    ],
	entryComponents: [SlideshowDialogComponent],
    providers      : [
        {
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
    ]
})
export class SlideshowDialogModule {}
