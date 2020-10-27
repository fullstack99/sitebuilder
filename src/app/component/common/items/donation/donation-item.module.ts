import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CurrencyMaskModule } from "ngx-currency-mask";
import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from "ngx-currency-mask/src/currency-mask.config";
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { DonationComponent } from '@app-items/donation/donation.component';
import { CommentDialogComponent } from '@app-items/donation/comment-dialog/comment-dialog.component';

@NgModule({
    declarations: [
        DonationComponent,
        CommentDialogComponent
	],
	exports: [DonationComponent,CommentDialogComponent],
	imports: [
            CommonModule,
            FormsModule,
            ReactiveFormsModule,
            FlexLayoutModule,
            DropDownModule,
            SplitTextBoxModule,            
            CurrencyMaskModule
		],
	entryComponents: [DonationComponent, CommentDialogComponent]
    
})
export class DonationItemModule {}
