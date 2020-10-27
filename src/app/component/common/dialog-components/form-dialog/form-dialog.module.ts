import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';

import { CommonCanvasModule } from '@app-common/common-canvas/common-canvas.module';

import { FormDialogComponent } from '@app-dialogs/form-dialog/form-dialog.component';
import { FormToolsComponent } from '@app-dialogs/form-dialog/tools/tools.component';
import { FormService } from '@app-dialogs/form-dialog/form.service';

export { FormDialogComponent } from '@app-dialogs/form-dialog/form-dialog.component';

@NgModule({
	declarations: [ FormDialogComponent, FormToolsComponent ],
	exports: [ FormDialogComponent, FormToolsComponent ],
	imports: [
			CommonModule,
			FormsModule,
			ReactiveFormsModule,
			SwiperModule,		
			DropDownModule,
			FeedbackDialogModule,		
			CommonCanvasModule,		
			LoadingModule,		        
		],
	entryComponents: [ FormDialogComponent ],
	providers: [ FormService ]
})
export class FormDialogModule { }
