import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { NewSiteDialogComponent } from '@app-dialogs/new-site-dialog/new-site-dialog.component';

@NgModule({	
	imports: [
		SharedModule,
		LoadingModule,
		FeedbackDialogModule
	],
	declarations: [NewSiteDialogComponent],
	exports: [NewSiteDialogComponent],
	entryComponents: [NewSiteDialogComponent],
	providers: []
})
export class NewSiteDialogModule { }
