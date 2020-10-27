import { Component, ElementRef, Renderer, EventEmitter, Input, Output, HostBinding,
         Injector, Inject, OnInit, ChangeDetectorRef
       } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';

import { Rect, Box } from '@app-lib/rect/rect';
import { Maybe } from '@app-lib/maybe/maybe';
import { DragSessionService, DragSession } from '@app-directives/drag-session/drag-session.service';

export interface SelectionEvent {
    box: Box;
    mouseEvent: MouseEvent | Touch;
}

@Component({
    moduleId   : module.id,
    selector   : 'element-selector',
    template   : '',
    styleUrls  : ['element-selector.component.css'],
    providers  : [DragSessionService]
})
export class ElementSelectorComponent implements OnInit {
    @Input() scale = 1;
    @Output() selectionEnd = new EventEmitter<SelectionEvent>();

    /** Canvas box relative to the page. */
    public _ele: HTMLElement;
    public _canvasRect: Rect;

    public _dragSession = new Rx.BehaviorSubject<Maybe<DragSession>>(Maybe.nothing<DragSession>());
    public _subs: Rx.Subscription[] = [];

    constructor(
        public _renderer: Renderer,
        public _elementRef: ElementRef,
        public _dragSessionService: DragSessionService,
        @Inject(DOCUMENT) public document: Document
    ) {
        this._ele = this._elementRef.nativeElement as HTMLElement;
    }

    ngOnInit() {
        const dragStart = Maybe.filterJustObs(this._dragSession)
            .distinctUntilChanged();

        const dragEnd = dragStart.map(s => s.dragEnd).switch(); // {}

        const dragging = dragStart.map(() => true)
            .merge(dragEnd.map(() => false));

        /** Starting horizontal position of selector relative to the canvas. */
        const initialX = dragStart.map(s => s.initialX - this._canvasRect.left)
            .publish().refCount();
        /** Starting vertical position of selector relative to the canvas. */
        const initialY = dragStart.map(s => s.initialY - this._canvasRect.top)
            .publish().refCount();

        const targetSideObs = (
            axis: 'x' | 'y'
        ) => dragStart
            .withLatestFrom(axis === 'x' ? initialX : initialY)
            .map(([session, init]) =>
                session.drag.scan((acc, drag) =>
                    acc + (axis === 'x' ? drag.deltaPrevX : drag.deltaPrevY),
                    init
                )
                .startWith(init)
            )
            .switch() // {}
            .publish().refCount();

        const targetX = targetSideObs('x');
        const targetY = targetSideObs('y');

        const sideObs = (
            targetObs: Rx.Observable<number>,
            initialObs: Rx.Observable<number>,
            sideSelector: (target: number, initial: number) => number,
            canvasLengthSelector: () => number
        ) => targetObs
            .withLatestFrom(initialObs)
            .map(([v, i]) =>
                lodash.clamp(sideSelector(v, i), 0, canvasLengthSelector())
            )
            .publish().refCount();

        const left   = sideObs(targetX, initialX, Math.min, () => this._canvasRect.width);
        const right  = sideObs(targetX, initialX, Math.max, () => this._canvasRect.width);
        const top   = sideObs(targetY, initialY, Math.min, () => this._canvasRect.height);
        const bottom = sideObs(targetY, initialY, Math.max, () => this._canvasRect.height);

        /** Selector box relative to the canvas. */
        const box = left
            .combineLatest(right)
            .combineLatest(top)
            .combineLatest(bottom)
            .map(([[[l, r], t], b]) => new Box(l - this.document.body.scrollLeft, r - this.document.body.scrollLeft, t - this.document.body.scrollTop, b - this.document.body.scrollTop))
            .publish().refCount();

        this._subs = [
            box.subscribe(({ left, right, top, bottom }) => { // tslint:disable-line:no-shadowed-variable
                // this._ele.style.left = left + 'px';
                const dx = left * this.scale - left;
                const dy = top * this.scale - top;
                this._ele.style.left = left / this.scale  + 'px';
                this._ele.style.top = top / this.scale  + 'px';
                this._ele.style.width = (right - left) / this.scale + 'px';
                this._ele.style.height = (bottom - top) / this.scale + 'px';
            }),

            dragEnd.withLatestFrom(box).subscribe(([dragEvent, box]) => { // tslint:disable-line:no-shadowed-variable
                const dx = box.left / this.scale;
                const dy = box.top / this.scale;
                box = box.moveTo(dx, dy);
                this.selectionEnd.emit({ box, mouseEvent: dragEvent.mouseEvent });
            }),

            dragging.subscribe(x => {
                this._ele.style.display = x ? 'block' : 'none';
            })
        ];
    }

    /**
     * @param canvasRect Canvas box relative to the page.
     * @param x Starting horizontal position of selector relative to the page.
     * @param y Starting vertical position of selector relative to the page.
     */
    startSelection(canvasRect: Rect, x: number, y: number) {
        this._canvasRect = canvasRect;
        this._dragSession.next(Maybe.just(this._dragSessionService.startDrag(x, y)));
    }

    ngOnDestroy() {
        this._dragSession.value.map(ds => ds.stopDrag());
        this._subs.forEach(x => x.unsubscribe());
    }
}
