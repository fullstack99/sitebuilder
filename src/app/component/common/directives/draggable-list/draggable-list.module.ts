import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DraggableListDirective } from '@app-directives/draggable-list/draggable-list.directive';
import { DraggableListItemDirective } from '@app-directives/draggable-list/draggable-list-item.directive';
import { DraggableListItemGripDirective } from '@app-directives/draggable-list/draggable-list-item-grip.directive';

@NgModule({
    declarations: [
        DraggableListDirective,
        DraggableListItemDirective,
        DraggableListItemGripDirective ],
    exports     : [
        DraggableListDirective,
        DraggableListItemDirective,
        DraggableListItemGripDirective ],
    imports     : [CommonModule],
    providers   : []
})
export class DraggableListModule {}
