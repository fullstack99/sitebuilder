import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RotateBoxComponent } from '@app-directives/rotatable/rotate-box.component';
import { RotatableDirective } from '@app-directives/rotatable/rotatable.directive';

@NgModule({
	declarations: [RotatableDirective, RotateBoxComponent],
	exports: [RotatableDirective],
	imports: [CommonModule],
	entryComponents: [RotateBoxComponent],
	providers: []
})
export class RotatableModule {}
