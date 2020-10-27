import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Ng2HighchartsModule } from 'ng2-highcharts';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { ChartDialogComponent } from '@app-dialogs/chart-dialog/chart-dialog.component';

@NgModule({
	declarations: [ ChartDialogComponent ],
	exports: [ ChartDialogComponent ],
	imports: [
        CommonModule,
        ReactiveFormsModule,
        Ng2HighchartsModule,
        FlexLayoutModule,
        DropDownModule,
        FeedbackDialogModule],

	entryComponents: [ ChartDialogComponent ],
	providers: []
})
export class ChartDialogModule { }
