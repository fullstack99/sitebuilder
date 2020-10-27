import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';

import { LocationsComponent } from '@app-dialogs/scheduler-setup-dialog/locations/locations.component';

@NgModule({
    declarations: [ LocationsComponent ],
    exports: [ LocationsComponent ],
    imports: [ CommonModule,
            FormsModule,
            ReactiveFormsModule, 
            RadioGroupModule, 
            SplitTextBoxModule
    ],
    entryComponents: [
        LocationsComponent
    ],
    providers: []
})
export class LocationsModule {}
