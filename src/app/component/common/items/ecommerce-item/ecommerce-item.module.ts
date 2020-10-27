import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { SortableModule } from '@progress/kendo-angular-sortable';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxTextOverflowClampModule } from 'ngx-text-overflow-clamp';
import { OrderModule } from 'ngx-order-pipe';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { ImageEnlargerModule } from '@app-ui/image-enlager/image-enlarger.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';

import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { EcommChooseItemDialogModule } from '@app-dialogs/ecomm-choose-item-dialog/ecomm-choose-item-dialog.module';

import { NewEcommerceItemModule } from '@app/component/ecommerce/items/new-item/new-item.module';

import { EcommerceItemComponent } from './ecommerce-item.component';
import { CheckOutComponent } from './check-out/check-out.component';
import { CreditCardsComponent } from './check-out/credit-cards/credit-cards.component';
import { OrderConfirmComponent } from './check-out/order-confirm/order-confirm.component';
import { ShippingAddressComponent } from './check-out/shipping-address/shipping-address.component';

import { ProductService } from '@app/services';

@NgModule({
	declarations: [
		EcommerceItemComponent,
		CheckOutComponent,
		ShippingAddressComponent,
		CreditCardsComponent,
		OrderConfirmComponent
	],
	exports: [
		EcommerceItemComponent,
		ShippingAddressComponent,
		CreditCardsComponent
	],
	imports: [
		SharedModule,
		SortableModule,
		NewEcommerceItemModule,
		NgxPaginationModule,
		NgxTextOverflowClampModule,
		
		OrderModule,
		AttentionDialogModule,
		FeedbackDialogModule,
		EcommChooseItemDialogModule,
		DropDownModule,
		ImageEnlargerModule,
		SplitTextBoxModule,
		TooltipModule,
		CheckboxModule,
		LoadingModule
	],
	entryComponents: [
		ShippingAddressComponent,
		CreditCardsComponent
	],
	providers: [
		ProductService		
	]
})

export class EcommerceItemModule {}
