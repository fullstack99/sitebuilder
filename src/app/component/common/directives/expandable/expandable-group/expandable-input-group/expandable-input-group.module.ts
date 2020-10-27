import { NgModule } from '@angular/core';
import { ExpandableModule } from '@app-directives/expandable/expandable.module';
import { ExpandableInputGroupComponent } from '@app-directives/expandable/expandable-group/expandable-input-group/expandable-input-group.component';
import { ExpandableInputModule } from '@app-directives/expandable/expandable-input/expandable-input.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';

@NgModule({
  declarations: [ExpandableInputGroupComponent],
  imports: [ExpandableModule, ExpandableInputModule, DraggableListModule, DraggableListInlineModule],
  exports: [ExpandableInputGroupComponent],
  providers: []
})
export class ExpandableInputGroupModule {}
