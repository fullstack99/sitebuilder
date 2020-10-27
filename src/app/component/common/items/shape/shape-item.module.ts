import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShapeComponent } from '@app-items/shape/shape.component';

@NgModule({
	declarations: [
		ShapeComponent
	],
	exports: [ShapeComponent],
	imports: [
			CommonModule,
		],
	entryComponents: [],
	providers: []
})
export class ShapeItemModule {}
