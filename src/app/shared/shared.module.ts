import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ValidationMessageComponent } from '@app-shared/validation-message/validation-message.component';

@NgModule({
	exports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		ValidationMessageComponent,
	],
	imports:[
		RouterModule,
		CommonModule,
		FormsModule,
		ReactiveFormsModule
	],
	declarations: [
		ValidationMessageComponent
	]
})
export class SharedModule { }
