import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { UnsubscribeDialogComponent } from '@app-dialogs/unsubscribe-dialog/unsubscribe-dialog.component';

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,		
		RadioGroupModule
	],
	declarations	: [UnsubscribeDialogComponent],
	exports        	: [UnsubscribeDialogComponent],
	
	entryComponents	: [UnsubscribeDialogComponent],
})
export class UnsubscribeDialogModule { }
