import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { ArrowButtonModule } from '@app-ui/arrow-button/arrow-button.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { WindowService } from '@app-common/window/window.service';

import { FreelancerHireMeDialogComponent } from '@app-dialogs/freelancer-hire-me-dialog/freelancer-hire-me-dialog.component';

@NgModule({
    declarations: [
        FreelancerHireMeDialogComponent
    ],
    imports: [        
        SharedModule,
        ArrowButtonModule,
        DateTimeModule,
        RadioGroupModule,        
    ],
    exports: [
        FreelancerHireMeDialogComponent
    ],    
    entryComponents: [
        FreelancerHireMeDialogComponent
    ]
})
export class FreelancerHireMeDialogModule {}
