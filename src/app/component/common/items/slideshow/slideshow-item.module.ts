import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileDropModule } from 'ngx-file-drop';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';

import { SlideshowComponent } from '@app-items/slideshow/slideshow.component';

@NgModule({
    declarations: [
		SlideshowComponent
	],
	exports: [SlideshowComponent],
	imports: [
            CommonModule,
            FileDropModule,
            BackgroundModule,
            BorderModule			
		],
	entryComponents: [],
    providers: []
})
export class SlideshowItemModule {}
