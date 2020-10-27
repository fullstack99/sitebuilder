import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { EmailSentDialogComponent } from './email-sent-dialog.component';


@NgModule({
    declarations   : [EmailSentDialogComponent],
    exports        : [EmailSentDialogComponent],
    imports        : [SharedModule, LoadingModule],
    entryComponents: [EmailSentDialogComponent]
})
export class EmailSentDialogModule {}
