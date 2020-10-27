import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { PromotionDialogModule } from '@app-dialogs/ecomm-promotion-dialog/ecomm-promotion-dialog.module';

import { EcommercePromotionsComponent } from './ecommerce-promotions.component';

import { ProductService } from '@app/services/product.service';
import { WindowService } from '@app-common/window/window.service';

@NgModule({
	declarations: [
		EcommercePromotionsComponent
	],
	imports: [
		RouterModule.forChild([
			{
				path: '',
				component: EcommercePromotionsComponent
			}
		]),
		PromotionDialogModule,		
		SharedModule,		
		RouterModule,		
		LoadingModule		
	],
	providers: [
        WindowService,
        ProductService
    ],
	entryComponents: [
		EcommercePromotionsComponent
	]
})
export class EcommercePromotionsModule {}
