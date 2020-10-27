
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { AutofocusModule } from '@app-common/directives';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';

import { EditorComponent } from './editor.component';

import { EditorService } from './editor.service';


@NgModule({
	declarations: [
		EditorComponent],
	exports: [EditorComponent],
	imports: [
		CommonModule,
		HttpModule,
		AutofocusModule,
		AttentionDialogModule,
		LoadingModule,
		MenubarModule
	],
  providers: [EditorService],

})
export class EditorModule { }
