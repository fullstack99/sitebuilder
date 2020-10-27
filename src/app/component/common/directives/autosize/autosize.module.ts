import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Autosize } from '@app-directives/autosize/autosize.directive';

@NgModule({
	declarations: [Autosize],
	exports: [Autosize],
	imports: [CommonModule],
	providers: []
})
export class AutosizeModule { }