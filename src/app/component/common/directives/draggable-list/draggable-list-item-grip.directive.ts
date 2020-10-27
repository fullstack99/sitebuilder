import { Directive, Input, Output, HostListener, EventEmitter, Optional
       } from '@angular/core';

import { DraggableListItemDirective } from '@app-directives/draggable-list/draggable-list-item.directive';

@Directive({
    selector: '[draggableListItemGrip]'
})
export class DraggableListItemGripDirective {
    @Input() draggableListItemGripEnable = true;
    @Output('draggableListItemGrip-readyToDrag') readyToDrag = new EventEmitter<boolean>();
    @Output('draggableListItemGrip-drag') drag = new EventEmitter<number>();

    constructor(
        @Optional() public _item: DraggableListItemDirective
    ) {}

    @HostListener('mouseenter')
    onMouseEnter() {
        // if (!this.draggableListItemGrip) return;
        this.readyToDrag.emit(true);
        if (this._item) {
            this._item.onReadyToDragCommand(true);
        }
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        if (!this.draggableListItemGripEnable) return;
        this.readyToDrag.emit(false);
        if (this._item) {
            this._item.onReadyToDragCommand(false);
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (!this.draggableListItemGripEnable) return;
        this.drag.emit(event.pageY);
        if (this._item) {
            this._item.onDragStartCommand(event.pageY);
        }

        event.stopPropagation();
        event.preventDefault();
    }
}
