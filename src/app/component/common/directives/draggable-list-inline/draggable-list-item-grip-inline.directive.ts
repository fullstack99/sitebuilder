import { Directive, Input, Output, HostListener, EventEmitter, Optional
       } from '@angular/core';

import { DraggableListItemInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-item-inline.directive';

@Directive({
    selector: '[draggableListItemGripInline]'
})
export class DraggableListItemGripInlineDirective {
    @Input() draggableListItemGripInlineEnable = true;
    @Output('draggableListItemGrip-readyToDrag') readyToDrag = new EventEmitter<boolean>();
    @Output('draggableListItemGrip-drag') drag = new EventEmitter<number>();

    constructor(
        @Optional() public _item: DraggableListItemInlineDirective
    ) {}

    @HostListener('mouseenter')
    onMouseEnter() {
        if (!this.draggableListItemGripInlineEnable) return;
        this.readyToDrag.emit(true);
        if (this._item) {
            this._item.onReadyToDragCommand(true);
        }
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        if (!this.draggableListItemGripInlineEnable) return;
        this.readyToDrag.emit(false);
        if (this._item) {
            this._item.onReadyToDragCommand(false);
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (!this.draggableListItemGripInlineEnable) return;
        this.drag.emit(event.pageX);
        if (this._item) {
            this._item.onDragStartCommand(event.pageX);
        }

        event.stopPropagation();
        event.preventDefault();
    }
}
