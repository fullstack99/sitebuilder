import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SlideshowGalleryModule } from '@app-dialogs/slideshow-dialog/slideshow-gallery/slideshow-gallery.module';
import { AddEmailDialogModule } from '@app-dialogs/add-email-dialog/add-email-dialog.module';
import { EventInfoComponent } from '@app-dialogs/event-setup-dialog/event-info/event-info.component';

import { WindowService } from '@app-common/window/window.service';
@NgModule({
	declarations: [ EventInfoComponent ],
	exports: [ EventInfoComponent ],
	imports: [
		CommonModule,
		SplitTextBoxModule,
		DateTimeModule,
		ReactiveFormsModule,
		SlideshowGalleryModule,
		AddEmailDialogModule,
		CheckboxModule
	],
	providers: [WindowService]
})
export class EventInfoModule {}
