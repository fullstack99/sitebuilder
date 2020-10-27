import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { WindowService } from '@app-common/window/window.service';

import { FreelancerAboutDialogComponent } from '@app-dialogs/freelancer-about-dialog/freelancer-about-dialog.component';

@NgModule({
    declarations: [
        FreelancerAboutDialogComponent
    ],
    imports: [        
        SharedModule,
    ],    
    exports:[
        FreelancerAboutDialogComponent
    ],
    providers: [ 
        WindowService
    ],
    entryComponents: [
        FreelancerAboutDialogComponent
    ]
})
export class FreelancerAboutDialogModule {}
