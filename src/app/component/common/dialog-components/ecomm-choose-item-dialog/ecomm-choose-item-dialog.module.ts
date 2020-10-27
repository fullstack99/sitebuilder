import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { CheckboxModule } from "@app-ui/checkbox/checkbox.module";
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { EcommChooseItemDialogComponent } from './ecomm-choose-item-dialog.component';
import { EcommChooseExistingItemComponent } from './choose-existing-item.component';

import { ProductService } from '@app/services';

export { EcommChooseItemDialogComponent } from './ecomm-choose-item-dialog.component';
export { EcommChooseExistingItemComponent } from './choose-existing-item.component';


@NgModule({
    declarations: [
        EcommChooseItemDialogComponent,
        EcommChooseExistingItemComponent
    ],
    exports: [
        EcommChooseItemDialogComponent,
        EcommChooseExistingItemComponent
    ],
    imports: [
        SharedModule,
        FeedbackDialogModule,
        LoadingModule,
        CheckboxModule,
        DropDownModule,
        RadioGroupModule
    ],
    entryComponents: [
        EcommChooseItemDialogComponent,
        EcommChooseExistingItemComponent
    ],
    providers: [
        ProductService
    ]
})
export class EcommChooseItemDialogModule {}
