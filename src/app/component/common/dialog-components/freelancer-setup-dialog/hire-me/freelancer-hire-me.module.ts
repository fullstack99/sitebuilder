import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CurrencyMaskModule } from "ngx-currency-mask";
import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from "ngx-currency-mask/src/currency-mask.config";

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { FreelancerHireMeComponent } from '@app-dialogs/freelancer-setup-dialog/hire-me/freelancer-hire-me.component';

@NgModule({
    declarations: [ FreelancerHireMeComponent ],
    exports: [ FreelancerHireMeComponent ],
    imports: [ 
            CommonModule,
            FormsModule,
            ReactiveFormsModule,
            CurrencyMaskModule,
            DateTimeModule,
            RadioGroupModule, 
            SplitTextBoxModule,            
    ],
    entryComponents: [
        FreelancerHireMeComponent
    ]
    
})
export class FreelancerHireMeModule {}
