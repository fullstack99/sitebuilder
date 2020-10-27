import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClipHandleComponent } from '@app-dialogs/image-editor/image-clippy/clip-handle/clip-handle.component';

@NgModule({
    declarations: [
        ClipHandleComponent
    ],
    exports: [ClipHandleComponent],
    imports: [
        CommonModule        
    ],
    entryComponents: [],
    providers: []
})

export class ClipHandleModule {}
