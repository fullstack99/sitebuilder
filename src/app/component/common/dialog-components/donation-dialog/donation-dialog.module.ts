import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { TooltipFormModule } from '@app-ui/tooltip-form/tooltip-form.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { ExpandableInputModule } from '@app-directives/expandable/expandable-input/expandable-input.module';
import { ExpandableGroupModule } from '@app-directives/expandable/expandable-group/expandable-group.module';
import { WindowService } from '@app-common/window/window.service';

import { DonationDialogComponent } from '@app-dialogs/donation-dialog/donation-dialog.component';
import { DonationLevelComponent } from '@app-dialogs/donation-dialog/donation-level/donation-level.component';
import { DesignationComponent } from '@app-dialogs/donation-dialog/designation/designation.component';
import { DedicationComponent } from '@app-dialogs/donation-dialog/dedication/dedication.component';
import { ContactInfoComponent } from '@app-dialogs/donation-dialog/contact-info/contact-info.component';
import { DonationFrequencyComponent } from '@app-dialogs/donation-dialog/donation-frequency/donation-frequency.component';
import { MessageDisplayComponent } from '@app-dialogs/donation-dialog/message-display/message-display.component';
import { ContactInfoFieldsComponent } from '@app-dialogs/donation-dialog/contact-info/contact-info-fields/contact-info-fields.component';
import { CurrencyFormatterDirective } from '@app-dialogs/donation-dialog/directives/currency-formatter.directive'
import { CurrencyPipe } from '@app-dialogs/donation-dialog/directives/currency.pipe'

@NgModule({
    declarations: [        
        DonationDialogComponent,
        DonationLevelComponent,
        DesignationComponent,
        DedicationComponent,
        ContactInfoComponent,
        DonationFrequencyComponent,
        MessageDisplayComponent,
        ContactInfoFieldsComponent,
        CurrencyFormatterDirective,
        CurrencyPipe
    ],
    exports: [ DonationDialogComponent ],
    imports: [ 
        CommonModule,
        HttpModule,
        JsonpModule,
        SplitTextBoxModule,
        DateTimeModule,
        ReactiveFormsModule,
        FormsModule,
        TooltipModule,
        DropDownModule,
        ExpandableInputModule,
        ExpandableGroupModule,        
        RadioGroupModule,
        CheckboxModule,      
        FeedbackDialogModule,
        TooltipFormModule
    ],
    providers: [WindowService, CurrencyPipe],
    entryComponents: [
        DonationDialogComponent,
        ContactInfoFieldsComponent
    ]
})
export class DonationDialogModule {}
