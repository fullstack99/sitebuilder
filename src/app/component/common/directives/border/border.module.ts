import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BorderDirective } from '@app-directives/border/border.directive';

@NgModule({
	declarations: [BorderDirective],
	exports: [BorderDirective],
	imports: [CommonModule],
	providers: []
})
export class BorderModule { }
