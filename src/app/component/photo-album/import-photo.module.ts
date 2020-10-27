import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, JsonpModule  } from '@angular/http';

import { PageCanvasToolsModule } from '@app-common/page-canvas/tools/page-canvas-tools.module';
import { PageCanvasModule } from '@app-common/page-canvas/page-canvas.module';

import { ImportPhotoComponent } from '@app/component/photo-album/import-photo.component';
import { WindowService } from '@app-common/window/window.service';

import { routing } from '@app/component/photo-album/import-photo.routes';

@NgModule({
    imports: [
        CommonModule,
        HttpModule,
        ReactiveFormsModule,
        FormsModule,
        PageCanvasToolsModule,
        PageCanvasModule,        
        routing
    ],
    declarations: [
        ImportPhotoComponent        
    ],
    exports: [
        ImportPhotoComponent
    ],
    providers: [
        WindowService        
    ],
    entryComponents: [        
    ]
})
export class ImportPhotoModule {

}
