import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { ImageClipToolsComponent } from '@app-dialogs/image-editor/image-clippy/image-clip-tools/image-clip-tools.component';

@NgModule({
    declarations: [
        ImageClipToolsComponent  
    ],
    exports: [ImageClipToolsComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SwiperModule
    ],
    entryComponents: [ImageClipToolsComponent],
    providers: []
})

export class ImageClipToolsModule {}
