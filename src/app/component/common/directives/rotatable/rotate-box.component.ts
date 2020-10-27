import { Component, Output, AfterViewInit, OnDestroy, EventEmitter, Input, ChangeDetectorRef, ElementRef
} from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { DragSessionService, DragEvent, DragSession } from '@app-directives/drag-session/drag-session.service';


@Component({
    moduleId: module.id,
    templateUrl: 'rotate-box.component.html',
    styleUrls: ['rotate-box.component.css']
})
export class RotateBoxComponent implements AfterViewInit, OnDestroy {
    @Input() enabled = false;
    @Input() degree = 0;
    @Output() rotateStart = new EventEmitter<void>();
    @Output() rotate = new EventEmitter<DragEvent>();
    @Output() rotateEnd = new EventEmitter<void>();

    public active = false;
    public _dragSession: DragSession;

    private viewInited: boolean = false;
    private sub: Rx.Subscription;

    constructor(
        private elementRef: ElementRef,
        private dragSessionService: DragSessionService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngAfterViewInit() {
        this.viewInited = true;
    }

    get getDegree() {
        return Math.round(this.degree);
    }

    startRotate(e: MouseEvent | TouchEvent) {
        if (!this.enabled)
          return;

        e.stopPropagation();
        e.preventDefault();

        this.active = true;
        let pageX = 0;
        let pageY = 0;

        if (e instanceof MouseEvent) {
          if (e.button !== 0)
            return;

          pageX = e.pageX;
          pageY = e.pageY;
        } else {
          pageX = e.changedTouches[0].pageX;
          pageY = e.changedTouches[0].pageY;
        }


        this._dragSession = this.dragSessionService.startDrag(pageX, pageY);

        if (this.sub) { this.sub.unsubscribe(); }
        this.sub = this._dragSession.drag.subscribe(
            (dragEvent) => this.rotate.emit(Object.assign({}, dragEvent)),
            () => {},
            () => this.rotateEnd.emit(undefined)
        );
        this.rotateStart.emit(undefined);
        this.refreshView();
    }

    stopRotate(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (this._dragSession)
            this._dragSession._onDragEnd(e);
        this.active = false;
        this.refreshView();
    }

    onClick(event: MouseEvent) {
        event.stopPropagation();
    }

    refreshView() {
        if (this.viewInited)
            this.changeDetector.detectChanges();
    }

    ngOnDestroy() {
        this.viewInited = false;
        if (this._dragSession) {
            this._dragSession.stopDrag();
        }

        if (this.sub) {
            this.sub.unsubscribe();
        }
    }
}
