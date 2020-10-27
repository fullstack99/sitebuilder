import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DraggableListInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-inline.directive';
import { DraggableListItemInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-item-inline.directive';
import { DraggableListItemGripInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-item-grip-inline.directive';

@NgModule({
    declarations: [
        DraggableListInlineDirective,
        DraggableListItemInlineDirective,
        DraggableListItemGripInlineDirective ],
    exports     : [
        DraggableListInlineDirective,
        DraggableListItemInlineDirective,
        DraggableListItemGripInlineDirective ],
    imports     : [CommonModule],
    providers   : []
})
export class DraggableListInlineModule {}
