import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterFormModule } from '@app-ui/register-form/register-form.module';

import { FreelancerAccountComponent } from '@app-dialogs/freelancer-setup-dialog/account/freelancer-account.component';

@NgModule({
    declarations: [ FreelancerAccountComponent ],
    exports: [ FreelancerAccountComponent ],
    imports: [ CommonModule,
            FormsModule,
            ReactiveFormsModule, 
            RegisterFormModule
    ],
    entryComponents: [
        FreelancerAccountComponent
    ],
    providers: []
})
export class FreelancerAccountModule {}
