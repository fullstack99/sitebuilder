import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResizeBoxComponent } from '@app-directives/resizable/resize-box.component';
import { ResizableDirective } from '@app-directives/resizable/resizable.directive';

@NgModule({
    declarations   : [ResizableDirective, ResizeBoxComponent],
    exports        : [ResizableDirective],
	imports		   : [CommonModule],
    entryComponents: [ResizeBoxComponent],
    providers      : []
})
export class ResizableModule {}
