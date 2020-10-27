import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ElementSelectorComponent } from '@app-directives/element-selector/element-selector.component';

@NgModule({
	declarations: [
		ElementSelectorComponent
	],
	exports: [ElementSelectorComponent],
	imports: [
		CommonModule,
	]
})
export class ElementSelectorModule { }
