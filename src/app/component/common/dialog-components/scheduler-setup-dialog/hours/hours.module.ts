
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { CapitalizeModule } from '@app-common/pipes';

import { HoursComponent } from '@app-dialogs/scheduler-setup-dialog/hours/hours.component';
import { DayTimeComponent } from '@app-dialogs/scheduler-setup-dialog/hours/day-time.component';

@NgModule({
    declarations: [ HoursComponent, DayTimeComponent ],
    exports: [ HoursComponent, DayTimeComponent ],
    imports: [ CommonModule,
            FormsModule,
            ReactiveFormsModule,
            AttentionDialogModule,
            CheckboxModule,
            DateTimeModule,
            DropDownModule,
            RadioGroupModule,
            TooltipModule,
            CapitalizeModule
    ],
    entryComponents: [
        HoursComponent,
        DayTimeComponent
    ],
    providers: []
})
export class HoursModule {}
