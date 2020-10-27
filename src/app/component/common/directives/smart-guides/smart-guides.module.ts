import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SmartGuidesComponent } from '@app-directives/smart-guides/smart-guides.component';

export { SmartGuidesComponent } from '@app-directives/smart-guides/smart-guides.component';

@NgModule({
    declarations: [SmartGuidesComponent],
    exports     : [SmartGuidesComponent],
    imports     : [CommonModule],
    providers   : []
})
export class SmartGuidesModule {}
