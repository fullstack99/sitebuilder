import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BackgroundModule } from '@app-directives/background/background.module';
import { BorderModule } from '@app-directives/border/border.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { ResizableModule } from '@app-directives/resizable/resizable.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SliderModule } from '@app-ui/slider/slider.module';
import { TimePickerModule } from '@app-ui/time-picker/time-picker.module';
import { AutosizeModule } from '@app-common/directives';
import { ContentEditableModule } from '@app-directives/content-editable/content-editable.module';

import { ButtonItemModule } from '@app-items/button/button-item.module';
import { ImageItemModule } from '@app-items/image/image-item.module';
import { GalleryItemModule } from '@app-items/gallery/gallery-item.module';
import { LinkTextItemModule } from '@app-items/text/link-text-item.module';
import { ShapeItemModule } from '@app-items/shape/shape-item.module';
import { SlideshowItemModule } from '@app-items/slideshow/slideshow-item.module';
import { VideoItemModule } from '@app-items/video/video-item.module';

import { LinkItemComponent } from '@app-items/link-item.component';

@NgModule({
    declarations: [			
            LinkItemComponent,
            
		],
	exports: [LinkItemComponent],
	imports: [
			CommonModule,			
			FormsModule,
			ReactiveFormsModule,
			
			BackgroundModule,
			BorderModule,
			DraggableListInlineModule,
			DraggableListModule,						
			ResizableModule,			
			SliderModule,
			DateTimeModule,
			TimePickerModule,
			AutosizeModule,
            ContentEditableModule,
            
            ButtonItemModule,
            ImageItemModule,
			GalleryItemModule,
			LinkTextItemModule,
			ShapeItemModule,
			SlideshowItemModule,
			VideoItemModule
		],
	entryComponents: [LinkItemComponent],
    providers: []
})
export class LinkItemModule {}
