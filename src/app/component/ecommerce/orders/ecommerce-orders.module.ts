
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';

import { EcommerceOrdersComponent } from './ecommerce-orders.component';


@NgModule({
	declarations: [EcommerceOrdersComponent],
	exports: [EcommerceOrdersComponent],
	imports: [
		RouterModule.forChild([
			{
				path: '',
				component: EcommerceOrdersComponent
			}
		]),
		SharedModule
	],
	providers: [],
	entryComponents: [EcommerceOrdersComponent]
})
export class EcommerceOrdersModule {}
