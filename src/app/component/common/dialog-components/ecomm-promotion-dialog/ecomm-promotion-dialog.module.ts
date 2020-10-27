import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { EcommChooseItemDialogModule } from "@app-dialogs/ecomm-choose-item-dialog/ecomm-choose-item-dialog.module";
import { ProductService } from '@app/services';

import { PromotionDialogComponent } from './ecomm-promotion-dialog.component';

@NgModule({
    declarations: [        
        PromotionDialogComponent
    ],
    exports: [ PromotionDialogComponent ],
    imports: [ 
        SharedModule,        
        DateTimeModule,        
        RadioGroupModule,        
        FeedbackDialogModule,
        LoadingModule,
        EcommChooseItemDialogModule
    ],
    providers: [ProductService],
    entryComponents: [
        PromotionDialogComponent
    ]
})
export class PromotionDialogModule {}
