import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileDropModule } from 'ngx-file-drop';
import { NgxImageZoomModule } from 'ngx-image-zoom';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';

import { GalleryComponent } from '@app-items/gallery/gallery.component';

@NgModule({
    declarations: [
		GalleryComponent
	],
	exports: [GalleryComponent],
	imports: [
            CommonModule,
            FileDropModule,
            BackgroundModule,
            BorderModule,
            NgxImageZoomModule.forRoot()			
		],
	entryComponents: [],
    providers: []
})
export class GalleryItemModule {}
