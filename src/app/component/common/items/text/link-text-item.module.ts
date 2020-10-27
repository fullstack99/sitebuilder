import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';

import { LinkTextComponent } from '@app-items/text/link-text.component';

@NgModule({
    declarations: [
		LinkTextComponent
	],
	exports: [LinkTextComponent],
	imports: [
            CommonModule,            
            BackgroundModule,
            BorderModule            
		],
	entryComponents: [],
    providers: []
})
export class LinkTextItemModule {}
