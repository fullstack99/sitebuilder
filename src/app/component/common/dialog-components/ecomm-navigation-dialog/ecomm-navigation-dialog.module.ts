import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { ProductService } from '@app/services';

import { EcommNavigationDialogComponent } from './ecomm-navigation-dialog.component';

export { EcommNavigationDialogComponent } from './ecomm-navigation-dialog.component';

@NgModule({
	declarations: [EcommNavigationDialogComponent],
	imports: [
		SharedModule,
		FeedbackDialogModule,
		LoadingModule
	],
	entryComponents: [
		EcommNavigationDialogComponent
	],
	providers: [
		ProductService
	]
})
export class EcommNavigationDialogModule { }
