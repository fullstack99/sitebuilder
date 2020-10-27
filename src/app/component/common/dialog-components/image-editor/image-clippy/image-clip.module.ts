import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraggableModule } from '@app-directives/draggable/draggable.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { ImageClipToolsModule } from '@app-dialogs/image-editor/image-clippy/image-clip-tools/image-clip-tools.module';
import { ClipHandleModule } from '@app-dialogs/image-editor/image-clippy/clip-handle/clip-handle.module';

import { ImageClipComponent } from '@app-dialogs/image-editor/image-clippy/image-clip.component';

@NgModule({
    declarations: [
        ImageClipComponent
    ],
    exports: [ImageClipComponent],
    imports: [
        CommonModule,
        DraggableModule,
        LoadingModule,
        ImageClipToolsModule,
        ClipHandleModule
    ],
    entryComponents: [],
    providers: []
})

export class ImageClipModule {}
