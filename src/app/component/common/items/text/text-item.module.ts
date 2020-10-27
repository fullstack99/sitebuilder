import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';

import { TextComponent } from '@app-items/text/text.component';
import { PageService } from '@app/services/page.service';
@NgModule({
	declarations: [
		TextComponent
	],
	exports: [TextComponent],
	imports: [
			CommonModule,
			BackgroundModule,
			BorderModule,
			TextEditorTinyMceModule
		],
	entryComponents: [],
	providers: [PageService]
})
export class TextItemModule {}
