import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { ExtraImportModule } from '@app-dialogs/video-dialog/import-dialog/extra/extra-import.module';

import { VideoImportDialogComponent } from '@app-dialogs/video-dialog/import-dialog/video-import-dialog.component';
import { VideoDialogComponent } from '@app-dialogs/video-dialog/video-dialog.component';
import { VideoService } from '@app-dialogs/video-dialog/video.service';


export { VideoDialogComponent } from '@app-dialogs/video-dialog/video-dialog.component';

@NgModule({
	declarations: [
		VideoDialogComponent,
		VideoImportDialogComponent],

	exports: [VideoDialogComponent],

	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		CheckboxModule,		
		DropDownModule,
		FeedbackDialogModule,		
		ExtraImportModule,		
		LoadingModule,
		MenubarModule,
		RadioGroupModule,
		SliderModule,	
		TooltipModule],

	entryComponents: [
		VideoDialogComponent,
		VideoImportDialogComponent],

	providers: [
		VideoService
	]
})
export class VideoDialogModule { }
