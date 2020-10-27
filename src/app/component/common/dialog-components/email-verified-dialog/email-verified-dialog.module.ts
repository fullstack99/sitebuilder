import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { EmailVerifiedDialogComponent } from './email-verified-dialog.component';


@NgModule({
    declarations   : [EmailVerifiedDialogComponent],
    exports        : [EmailVerifiedDialogComponent],
    imports        : [SharedModule, LoadingModule],
    entryComponents: [EmailVerifiedDialogComponent]
})
export class EmailVerifiedDialogModule {}
