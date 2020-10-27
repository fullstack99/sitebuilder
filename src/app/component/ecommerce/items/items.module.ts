import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';

import { OrderModule } from 'ngx-order-pipe';
import { ClickOutsideModule } from 'ng-click-outside';
import { CurrencyMaskModule } from 'ngx-currency-mask';
import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from 'ngx-currency-mask/src/currency-mask.config';

import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DateTimeRangeModule } from '@app-ui/datetime-range/datetime-range.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { NewEcommerceItemModule } from '@app/component/ecommerce/items/new-item/new-item.module';
import { DropdownEditorModule } from '@app-ui/drop-down-editor/drop-down-editor.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { InventoryGridComponent } from '@app/component/ecommerce/items/inventory-grid/inventory-grid.component';
import { SalesRangeComponent } from '@app/component/ecommerce/items/items-grid/sales-range/sales-range.component';
import { ItemsGridComponent } from '@app/component/ecommerce/items/items-grid/items-grid.component';
import { ItemsComponent } from '@app/component/ecommerce/items/items.component';
import { CatalogNavigationComponent } from '@app/component/ecommerce/items/catalog-navigation/catalog-navigation.component';

import { ProductService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';
import { YesNoPipe } from '@app-pipes/index';

@NgModule({
	declarations: [
		ItemsComponent,
		ItemsGridComponent,
		InventoryGridComponent,
		SalesRangeComponent,
		YesNoPipe,
		CatalogNavigationComponent
	],
	imports: [
		RouterModule.forChild([
			{
				path: '',
				component: ItemsComponent
			}
		]),
		SharedModule,
		NewEcommerceItemModule,
		DateTimeModule,
		DateTimeRangeModule,
		CurrencyMaskModule,
		DropDownModule,
		RouterModule,
		TooltipModule,
		OrderModule,
		ClickOutsideModule,
		LoadingModule,
		MenubarModule,
		DropdownEditorModule,
		RadioGroupModule,
		AttentionDialogModule,
	],
	providers: [WindowService, ProductService],
	entryComponents: [
		SalesRangeComponent,
		InventoryGridComponent,
		ItemsGridComponent,
		CatalogNavigationComponent
	]
})
export class ItemsModule {}
