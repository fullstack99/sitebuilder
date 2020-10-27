import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { PreferenceDialogComponent } from '@app-dialogs/preference-dialog/preference-dialog.component';

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,    
    	CheckboxModule
	],
	declarations	: [PreferenceDialogComponent],
	exports        	: [PreferenceDialogComponent],	
	entryComponents	: [PreferenceDialogComponent],
})
export class PreferenceDialogModule { }
