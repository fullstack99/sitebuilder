import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { SkippingDialogComponent } from '@app-dialogs/skipping-dilaog/skipping-dialog.component';

export { SkippingDialogComponent } from '@app-dialogs/skipping-dilaog/skipping-dialog.component';

@NgModule({
    declarations   : [SkippingDialogComponent],
    exports        : [SkippingDialogComponent],
    imports        : 
        [
            CommonModule, 
            FormsModule,
		    ReactiveFormsModule, 
            RadioGroupModule
        ],
    entryComponents: [SkippingDialogComponent],
    providers      : []
})
export class SkippingDialogModule {}
