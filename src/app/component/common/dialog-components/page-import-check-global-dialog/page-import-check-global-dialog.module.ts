import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { PageImportCheckGlobalDialogComponent } from './page-import-check-global-dialog.component';

@NgModule({
    declarations: [        
        PageImportCheckGlobalDialogComponent
    ],
    exports: [ PageImportCheckGlobalDialogComponent ],
    imports: [ 
        SharedModule,              
        FeedbackDialogModule,
        RadioGroupModule
    ],
    providers: [
        
    ],
    entryComponents: [
        PageImportCheckGlobalDialogComponent
    ]
})
export class PageImportCheckGlobalDialogModule {}
