import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PageCanvasModule } from '@app-common/page-canvas/page-canvas.module';
import { PageCanvasToolsModule } from '@app-common/page-canvas/tools/page-canvas-tools.module';
import { SurveyComponent } from '@app/component/survey/survey.component';
import { routing } from '@app/component/survey/survey.routes';

export { SurveyComponent } from '@app/component/survey/survey.component';

@NgModule({
	declarations: [ SurveyComponent ],
	exports: [SurveyComponent ],
	imports: [
		CommonModule,
		ReactiveFormsModule,		
		PageCanvasModule,
		PageCanvasToolsModule,		
		routing
	],	
	providers: []
})
export class SurveyModule { }
