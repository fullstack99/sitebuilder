import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContenteditableModel } from '@app-directives/content-editable/content-editable.directive';

@NgModule({
	declarations: [ContenteditableModel],
	exports: [ContenteditableModel],
	imports: [CommonModule],
	providers: []
})
export class ContentEditableModule { }