import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DraggableDirective } from "@app-directives/draggable/draggable.directive";
import {
  SmartGuidesModule,
  SmartGuidesComponent
} from "@app-directives/smart-guides/smart-guides.module";

@NgModule({
  declarations: [DraggableDirective],
  exports: [DraggableDirective],
  imports: [CommonModule, SmartGuidesModule],
  entryComponents: [SmartGuidesComponent],
  providers: []
})
export class DraggableModule {}
