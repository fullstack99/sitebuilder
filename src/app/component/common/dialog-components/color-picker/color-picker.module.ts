import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';

export { ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';

@NgModule({
    declarations: [ColorPickerComponent],
    exports     : [ColorPickerComponent],
    imports     : [CommonModule, ReactiveFormsModule],
    providers   : [],
    entryComponents: [ColorPickerComponent]
})
export class ColorPickerModule {}
