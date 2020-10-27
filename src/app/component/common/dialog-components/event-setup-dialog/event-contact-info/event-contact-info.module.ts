import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ParticipantContactInfoComponent } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info.component';
import { ParticipantContactInfoFieldsComponent
       } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info-fields/participant-contact-info-fields.component';
import { EventContactInfoComponent } from '@app-dialogs/event-setup-dialog/event-contact-info/event-contact-info.component';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DateTimeRangeModule } from '@app-ui/datetime-range/datetime-range.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module'
import { TooltipFormModule } from '@app-ui/tooltip-form/tooltip-form.module'
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module'

@NgModule({
    declarations: [
        EventContactInfoComponent,
        ParticipantContactInfoComponent,
        ParticipantContactInfoFieldsComponent],
    exports: [ EventContactInfoComponent ],
    imports: [
        CommonModule, RadioGroupModule, SplitTextBoxModule,
        CheckboxModule, DateTimeRangeModule, ReactiveFormsModule,
        TooltipModule, TooltipFormModule, FeedbackDialogModule
        ],
    entryComponents: [ParticipantContactInfoFieldsComponent],
    providers: []
})
export class EventContactInfoModule {}
