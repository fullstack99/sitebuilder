import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { OptionSettingsComponent } from '@app/component/ecommerce/items/new-item/item-options/option-settings/option-settings.component';

@NgModule({
  declarations: [OptionSettingsComponent],
  exports: [OptionSettingsComponent],
  imports: [CommonModule, AttentionDialogModule, DropDownModule],
  providers: [],
  entryComponents: [OptionSettingsComponent]
})
export class OptionSettingsModule {}
