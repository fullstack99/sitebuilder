import { Directive, Output, HostBinding, HostListener, OnDestroy, EventEmitter,
         ElementRef, Host, forwardRef, Inject, Input
       } from '@angular/core';
import * as lodash from 'lodash';

import { DraggableListDirective } from '@app-directives/draggable-list/draggable-list.directive';

const ANIMATION_DURATION = 200;

@Directive({
    selector: '[draggableListItem]'
})
export class DraggableListItemDirective implements OnDestroy {
    get offsetTop(): number {
        return (this._elementRef.nativeElement as HTMLElement).offsetTop;
    }

    get offsetHeight(): number {
        return (this._elementRef.nativeElement as HTMLElement).offsetHeight;
    }

    get element(): HTMLElement {
        return this._elementRef.nativeElement;
    }

    @Input() draggableListItemEnable = true;
    @Input('draggableListItem-animate') animate = true;

    @Output('draggableListItem-dragStart') dragStart = new EventEmitter<void>();
    @Output('draggableListItem-dragEnd') dragEnd = new EventEmitter<void>();
    @Output('draggableListItem-drag') drag = new EventEmitter<number>();

    @HostBinding('style.top')
    get styleTop(): string { return this._deltaY + 'px'; }

    @HostBinding('style.z-index')
    get styleZIndex(): string { return this.dragging ? '100' : 'auto'; }

    @HostBinding('style.transition')
    get styleTransition(): string {
        return this.animate
            ? (this.dragging ? 'none' : `top ${ANIMATION_DURATION}ms ease-in-out`)
            : 'none';
    }

    @HostBinding('class.dragging') dragging = false;
    @HostBinding('class.ready-to-drag') readyToDrag = false;

    public _startingPageY: number;
    public _deltaY: number = 0;
    public _startingOffsetTop: number;

    constructor (
        public _elementRef: ElementRef,
        @Host() @Inject(forwardRef(() => DraggableListDirective))
        public _draggableList: DraggableListDirective
    ) {}

    @HostListener('readyToDragCommand')
    onReadyToDragCommand(ready: boolean) {
        this.readyToDrag = ready;
    }

    @HostListener('dragStartCommand', ['$event'])
    onDragStartCommand(startingPageY: number) {
        this.dragging = true;
        this._startingPageY = startingPageY;
        this._deltaY = 0;
        this._startingOffsetTop = (this._elementRef.nativeElement as HTMLElement).offsetTop;
        this._disableSelection();

        this.dragStart.emit(undefined);
    }

    @HostListener('window:mouseup', ['$event'])
    onDragEnd(event: MouseEvent) {
        if (!this.draggableListItemEnable) return;
        if (this.dragging) {
            this.dragging = false;
            this._deltaY = 0;
            this._enableSelection();
            event.stopPropagation();
            event.preventDefault();

            this.dragEnd.emit(undefined);
        }
    }

    @HostListener('window:mousemove', ['$event'])
    onDrag(event: MouseEvent) {
        if (!this.draggableListItemEnable) return;
        if (this.dragging) {
            const deltaY = event.pageY - this._startingPageY;
            const elem = this._elementRef.nativeElement as HTMLElement;

            // Limit top and bottom of a drag movement.
            this._deltaY = lodash.clamp(
                deltaY,
                -this._startingOffsetTop,
                this._draggableList.offsetHeight - elem.offsetHeight - this._startingOffsetTop
            );

            event.stopPropagation();
            event.preventDefault();
            this.drag.emit(this._deltaY);
        }
    }

    onSiblingDragStart() {
        // if (!this.draggableListItem) return;
        this._disableSelection();
    }

    onSiblingDragEnd() {
        // if (!this.draggableListItem) return;
        this._enableSelection();
    }

    setTop(y: number) {
        this._deltaY = y;
    }

    ngOnDestroy() {
    }

    public _disableSelection() {
        // if (!this.draggableListItem) return;
        disableElementSelection(this._elementRef.nativeElement);

        const elems = (this._elementRef.nativeElement as HTMLElement)
            .querySelectorAll('input, textarea');
        Array.prototype.forEach.call(elems, disableElementSelection);
    }

    public _enableSelection() {
        // if (!this.draggableListItem) return;
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
