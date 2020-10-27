import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackgroundDirective } from '@app-directives/background/background.directive';

@NgModule({
	declarations: [BackgroundDirective],
	exports: [BackgroundDirective],
	imports: [CommonModule],
	providers: []
})
export class BackgroundModule { }
