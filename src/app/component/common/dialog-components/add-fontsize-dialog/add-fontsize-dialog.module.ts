import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { AddFontSizeDialogComponent } from './add-fontsize-dialog.component';

@NgModule({	
	imports: [
		SharedModule		
	],
	declarations: [AddFontSizeDialogComponent],
	exports: [AddFontSizeDialogComponent],
	entryComponents: [AddFontSizeDialogComponent],
	providers: []
})
export class AddFontSizeDialogModule { }
