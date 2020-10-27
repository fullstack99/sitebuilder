import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { TagsInputModule } from '@app-ui/tags-input/tags-input.module';
import { TooltipModule } from '@app-ui/tooltip/tooltip.module';
import { ServicesComponent } from '@app-dialogs/scheduler-setup-dialog/services/services.component';

@NgModule({
    declarations: [ ServicesComponent ],
    exports: [ ServicesComponent ],
    imports: [ 
            CommonModule,
            FormsModule,
            ReactiveFormsModule,
            CheckboxModule,
            DropDownModule,
            DateTimeModule,
            RadioGroupModule, 
            SplitTextBoxModule,
            TagsInputModule,
            TooltipModule
    ],
    entryComponents: [
        ServicesComponent
    ],
    providers: []
})
export class ServicesModule {}
