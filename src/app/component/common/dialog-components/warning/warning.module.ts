import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WarningComponent } from '@app-dialogs/warning/warning.component';

@NgModule({
    declarations: [WarningComponent],
	exports		: [WarningComponent],
    imports     : [CommonModule],	
    providers   : []
})
export class WarningModule {}

