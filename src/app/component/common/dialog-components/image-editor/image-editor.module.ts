
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { FileDropModule } from 'ngx-file-drop';
import { TreeModule } from '@app-common/tree/tree.module';
import { AutofocusModule } from '@app-common/directives';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { ImageClipModule } from './image-clippy/image-clip.module';
import { SliderModule } from '@app-ui/slider/slider.module';

import { ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.component';
import { ImageBrowserComponent } from './image-browser/image-browser.component';
import { ImageStockComponent } from './image-stock/image-stock.component';
import { ImageSitemapComponent } from './image-sitemap/image-sitemap.component';
import { EditorComponent } from './image-editor/editor.component';
import { ImageImportDialogComponent } from './import-dialog/image-import-dialog.component';

import { EditorService } from './editor/editor.service';

export { ImageEditorComponent } from './image-editor.component';

@NgModule({
	declarations: [
		ImageEditorComponent,
		ImageBrowserComponent,
		ImageStockComponent,
		ImageSitemapComponent,
		EditorComponent,
		ImageImportDialogComponent],
	exports: [ImageEditorComponent],
	imports: [
		CommonModule,
		TreeModule,
    FormsModule,
		ReactiveFormsModule,
		HttpModule,
		FileDropModule,
		AutofocusModule,
		AttentionDialogModule,
		LoadingModule,
		MenubarModule,
		ImageClipModule,
    SliderModule
	],
	providers: [EditorService],
	entryComponents: [ImageImportDialogComponent, ImageEditorComponent],
})
export class ImageEditorModule { }
