import { NgModule } from '@angular/core';
import { ItemOptionsComponent } from '@app/component/ecommerce/items/new-item/item-options/item-options.component';
import { SharedModule } from '@app/shared/shared.module';
import { CurrencyMaskModule } from "ngx-currency-mask";
import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from "ngx-currency-mask/src/currency-mask.config";
import { ExpandableInputGroupModule } from '@app-directives/expandable/expandable-group/expandable-input-group/expandable-input-group.module';
import { OptionSettingsModule } from './option-settings/option-settings.module';

@NgModule({
	declarations: [ItemOptionsComponent],
	exports: [ItemOptionsComponent],
	imports: [
		SharedModule,
		CurrencyMaskModule,
		ExpandableInputGroupModule,		
		OptionSettingsModule		
	],
	providers: [],
	entryComponents: [ItemOptionsComponent]
})
export class ItemOptionsModule {}
