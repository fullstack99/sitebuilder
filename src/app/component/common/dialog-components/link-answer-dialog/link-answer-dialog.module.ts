import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';

import { LinkAnswerDialogComponent } from './link-answer-dialog.component';

export { LinkAnswerDialogComponent } from './link-answer-dialog.component';

@NgModule({
    declarations   : [LinkAnswerDialogComponent],
    exports        : [LinkAnswerDialogComponent],
    imports        :
        [
            CommonModule,
            FormsModule,
		        ReactiveFormsModule,
            RadioGroupModule
        ],
    entryComponents: [LinkAnswerDialogComponent],
    providers      : []
})
export class LinkAnswerDialogModule {}
