import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';
import { WindowService } from '@app-common/window/window.service';

import { VideoComponent } from '@app-items/video/video.component';

@NgModule({
	declarations: [
		VideoComponent
	],
	exports: [VideoComponent],
	imports: [
			CommonModule,
			BackgroundModule,
			BorderModule,
			ImageEditorModule
		],
	entryComponents: [],
	providers: [WindowService]
})
export class VideoItemModule {}
