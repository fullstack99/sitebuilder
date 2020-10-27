import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { PageImportDialogComponent } from './page-import-dialog.component';

@NgModule({
    declarations: [        
        PageImportDialogComponent
    ],
    exports: [ PageImportDialogComponent ],
    imports: [ 
        SharedModule,              
        FeedbackDialogModule,
        LoadingModule,
        RadioGroupModule
    ],
    providers: [
        
    ],
    entryComponents: [
        PageImportDialogComponent
    ]
})
export class PageImportDialogModule {}
