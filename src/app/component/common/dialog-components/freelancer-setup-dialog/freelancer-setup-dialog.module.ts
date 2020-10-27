import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { FreelancerAboutModule } from '@app-dialogs/freelancer-setup-dialog/about/freelancer-about.module';
import { FreelancerAccountModule } from '@app-dialogs/freelancer-setup-dialog/account/freelancer-account.module';
import { FreelancerHireMeModule } from '@app-dialogs/freelancer-setup-dialog/hire-me/freelancer-hire-me.module';
import { FreelancerService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';

import { FreelancerSetupDialogComponent } from '@app-dialogs/freelancer-setup-dialog/freelancer-setup-dialog.component';

@NgModule({
    declarations: [
        FreelancerSetupDialogComponent
    ],
    imports: [        
        SharedModule,        
        FreelancerAboutModule,
        FreelancerAccountModule,
        FreelancerHireMeModule
    ],    
    entryComponents: [
        FreelancerSetupDialogComponent
    ],
    providers:[FreelancerService]
})
export class FreelancerSetupDialogModule {}
