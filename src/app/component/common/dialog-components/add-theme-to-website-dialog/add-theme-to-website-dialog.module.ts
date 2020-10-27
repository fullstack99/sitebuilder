import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { AddThemeToWebsiteDialogComponent } from './add-theme-to-website-dialog.component';
import { WindowService } from '@app-common/window/window.service';

@NgModule({
	declarations: [
		AddThemeToWebsiteDialogComponent,
	],
	imports: [
		SharedModule,
	],
	exports: [
		AddThemeToWebsiteDialogComponent
	],
	providers: [
		WindowService
	],
	entryComponents: [
		AddThemeToWebsiteDialogComponent
	]
})
export class AddThemeToWebsiteDialogModule { }

