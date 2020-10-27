import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';

import { ImageComponent } from '@app-items/image/image.component';

@NgModule({
    declarations: [
		ImageComponent
	],
	exports: [ImageComponent],
	imports: [
            CommonModule,           
            BackgroundModule,
            BorderModule			
		],
	entryComponents: [],
    providers: []
})
export class ImageItemModule {}
