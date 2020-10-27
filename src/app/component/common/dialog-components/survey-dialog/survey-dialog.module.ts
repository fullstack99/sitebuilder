import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';

import { CommonCanvasModule } from '@app-common/common-canvas/common-canvas.module';
import { BranchDialogModule } from '@app-dialogs/survey-dialog/branch/branch-dialog.module';

import { SurveyDialogComponent } from '@app-dialogs/survey-dialog/survey-dialog.component';
import { SurveyToolsComponent } from '@app-dialogs/survey-dialog/tools/tools.component';
import { SurveyService } from '@app-dialogs/survey-dialog/survey.service';

export { SurveyDialogComponent } from '@app-dialogs/survey-dialog/survey-dialog.component';


const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
	direction: 'horizontal',
	slidesPerView: 'auto',
	keyboard: false
};

@NgModule({
	declarations: [ SurveyDialogComponent, SurveyToolsComponent ],
	exports: [SurveyDialogComponent, SurveyToolsComponent ],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		DropDownModule,
		FeedbackDialogModule,
		CommonCanvasModule,
		LoadingModule,
		SwiperModule,
		BranchDialogModule
	],
	entryComponents: [ SurveyDialogComponent ],
	providers: [
		SurveyService,
		{
			provide: SWIPER_CONFIG,
			useValue: DEFAULT_SWIPER_CONFIG
		}
	]
})
export class SurveyDialogModule { }
