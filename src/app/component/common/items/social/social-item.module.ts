import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileDropModule } from 'ngx-file-drop';

import { SocialComponent } from '@app-items/social/social.component';

@NgModule({
	declarations: [
		SocialComponent
	],
	exports: [SocialComponent],
	imports: [
			CommonModule,
			FileDropModule
		],
	entryComponents: [],
	providers: []
})
export class SocialItemModule {}