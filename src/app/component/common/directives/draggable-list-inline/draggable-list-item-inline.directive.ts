import { Directive, Output, HostBinding, HostListener, OnDestroy, EventEmitter,
         ElementRef, Host, forwardRef, Inject, Input
       } from '@angular/core';
import * as lodash from 'lodash';

import { DraggableListInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-inline.directive';

const ANIMATION_DURATION = 200;

@Directive({
    selector: '[draggableListItemInline]'
})
export class DraggableListItemInlineDirective implements OnDestroy {
    get offsetLeft(): number {
        return (this._elementRef.nativeElement as HTMLElement).offsetLeft;
    }

    get offsetWidth(): number {
        return (this._elementRef.nativeElement as HTMLElement).offsetWidth;
    }

    get element(): HTMLElement {
        return this._elementRef.nativeElement;
    }
    
    @Input() draggableListItemInlineEnable = true;
    @Input('draggableListItem-animate') animate = true;

    @Output('draggableListItem-dragStart') dragStart = new EventEmitter<void>();
    @Output('draggableListItem-dragEnd') dragEnd = new EventEmitter<void>();
    @Output('draggableListItem-drag') drag = new EventEmitter<number>();

    @HostBinding('style.left')
    get styleLeft(): string { return this._deltaX + 'px'; }

    @HostBinding('style.z-index')
    get styleZIndex(): string { return this.dragging ? '100' : 'auto'; }

    @HostBinding('style.transition')
    get styleTransition(): string {
        if (!this.draggableListItemInlineEnable) return 'none';
        return this.animate
            ? (this.dragging ? 'none' : `left ${ANIMATION_DURATION}ms ease-in-out`)
            : 'none';
    }

    @HostBinding('class.dragging') dragging = false;
    @HostBinding('class.ready-to-drag') readyToDrag = false;

    public _startingPageX: number;
    public _deltaX: number = 0;
    public _startingOffsetLeft: number;

    constructor (
        public _elementRef: ElementRef,
        @Host() @Inject(forwardRef(() => DraggableListInlineDirective))
        public _draggableList: DraggableListInlineDirective
    ) {}

    @HostListener('readyToDragCommand')
    onReadyToDragCommand(ready: boolean) {
        this.readyToDrag = ready;
    }

    @HostListener('dragStartCommand', ['$event'])
    onDragStartCommand(startingPageX: number) {
        if (!this.draggableListItemInlineEnable) return;
        this.dragging = true;
        this._startingPageX = startingPageX;
        this._deltaX = 0;
        this._startingOffsetLeft = (this._elementRef.nativeElement as HTMLElement).offsetLeft
        this._disableSelection();

        this.dragStart.emit(undefined);
    }

    @HostListener('window:mouseup', ['$event'])
    onDragEnd(event: MouseEvent) {
        if (!this.draggableListItemInlineEnable) return;
        if (this.dragging) {
            this.dragging = false;
            this._deltaX = 0;
            this._enableSelection();
            event.stopPropagation();
            event.preventDefault();

            this.dragEnd.emit(undefined);
        }
    }

    @HostListener('window:mousemove', ['$event'])
    onDrag(event: MouseEvent) {
        if (!this.draggableListItemInlineEnable) return;
        if (this.dragging) {
            const deltaX = event.pageX - this._startingPageX;
            const elem = this._elementRef.nativeElement as HTMLElement;

            // Limit left and right of a drag movement.
            this._deltaX = lodash.clamp(
                deltaX,
                -this._startingOffsetLeft,
                this._draggableList.offsetWidth - elem.offsetWidth - this._startingOffsetLeft
            );

            event.stopPropagation();
            event.preventDefault();

            this.drag.emit(this._deltaX);
        }
    }

    onSiblingDragStart() {
        if (!this.draggableListItemInlineEnable) return;
        this._disableSelection();
    }

    onSiblingDragEnd() {
        if (!this.draggableListItemInlineEnable) return;
        this._enableSelection();
    }

    setLeft(x: number) {
        this._deltaX = x;
    }

    ngOnDestroy() {
    }

    public _disableSelection() {
        // if (!this.draggableListItemInline) return;
        disableElementSelection(this._elementRef.nativeElement);

        const elems = (this._elementRef.nativeElement as HTMLElement)
            .querySelectorAll('input, textarea');
        Array.prototype.forEach.call(elems, disableElementSelection);
    }

    public _enableSelection() {
        // if (!this.draggableListItemInline) return;
        enableElementSelection(this._elementRef.nativeElement);

        const elems = (this._elementRef.nativeElement as HTMLElement)
            .querySelectorAll('input, textarea');
        Array.prototype.forEach.call(elems, enableElementSelection);
    }
}

function disableElementSelection(elem: HTMLElement) {
    elem.style['mozUserSelect'] = 'none';
    elem.style['khtmlUserSelect'] = 'none';
    elem.style.webkitUserSelect = 'none';
    elem.style.msUserSelect = 'none';
    elem.style['userSelect'] = 'none';
}

function enableElementSelection(elem: HTMLElement) {
    elem.style['mozUserSelect'] = 'auto';
    elem.style['khtmlUserSelect'] = 'auto';
    elem.style.webkitUserSelect = 'auto';
    elem.style.msUserSelect = 'auto';
    elem.style['userSelect'] = 'auto';
}
