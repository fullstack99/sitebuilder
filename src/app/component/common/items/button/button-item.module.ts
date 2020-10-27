import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app-items/button/button.component';

@NgModule({
    declarations: [
		ButtonComponent
	],
	exports: [ButtonComponent],
	imports: [
			CommonModule			
		],
	entryComponents: [],
    providers: []
})
export class ButtonItemModule {}
