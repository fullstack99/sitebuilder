import { Directive,  ContentChildren, AfterContentInit,
         OnDestroy, QueryList, ElementRef, EventEmitter, Output, Input
       } from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { Maybe } from '@app-lib/maybe/maybe';
import { elementRectPage } from '@app-lib/dom/dom';

import { DraggableListItemInlineDirective } from '@app-directives/draggable-list-inline/draggable-list-item-inline.directive';

interface DragStartEvent {
    itemIndex: number;
    item: DraggableListItemInlineDirective;
}

interface DragEvent {
    itemIndex: number;
    item: DraggableListItemInlineDirective;
    deltaX: number;
}

interface ItemPostion {
    left: number;
    width: number;
}

@Directive({
    selector: '[draggableListInline]'
})
export class DraggableListInlineDirective implements AfterContentInit, OnDestroy {
    get offsetWidth(): number {
        return (this._elementRef.nativeElement as HTMLElement).offsetWidth;
    }

    @ContentChildren(DraggableListItemInlineDirective)
    public _queryList: QueryList<DraggableListItemInlineDirective>;
    @Input () draggableListInlineEnable = true;
    @Output('draggableList-newIndexes') readonly newIndexes = new EventEmitter<number[]>();

    items         : Rx.Observable<DraggableListItemInlineDirective[]>;
    itemsMargin   : Rx.Observable<number>;
    dragStart     : Rx.Observable<DragStartEvent>;
    drag          : Rx.Observable<DragEvent>;
    dragEnd       : Rx.Observable<void>;
    itemsPositions: Rx.Observable<ItemPostion[]>;
    itemSiblings  : Rx.Observable<DraggableListItemInlineDirective[]>;
    targetIndex   : Rx.Observable<number>;
    indexesChange : Rx.Observable<number[]>;
    itemsLefts    : Rx.Observable<Maybe<number>[]>;

    constructor (
        public readonly _elementRef: ElementRef
    ) {}

    ngAfterContentInit() {
        // if (!this.draggableListInline) return;
        this.items = this._queryList.changes
            .startWith(this._queryList)
            .map((x: QueryList<DraggableListItemInlineDirective>) =>
                x.toArray()
            );

        this.dragStart = this.items.map((items) =>
            Rx.Observable.merge.apply(
                undefined,
                items.map((item, itemIndex) =>
                    item.dragStart.asObservable().map<any, DragStartEvent>(() => {
                        return { itemIndex, item };
                    })
                )
            ) as Rx.Observable<DragStartEvent>
        ).switch().publish().refCount();

        this.itemsMargin = this.dragStart
            .withLatestFrom(this.items)
            .map(([_, items]) =>
                items.length <= 1
                    ? 0
                    : elementRectPage(items[1].element).left - elementRectPage(items[0].element).right()
            ).publish().refCount();

        this.drag = this.items.map((items) =>
            Rx.Observable.merge.apply(
                undefined,
                items.map((item, itemIndex) =>
                    item.drag.asObservable().map<any, DragEvent>((deltaX: number) => {
                        return { itemIndex, item, deltaX, offsetLeft: item.offsetLeft };
                    })
                )
            ) as Rx.Observable<DragEvent>
        ).switch().publish().refCount();

        this.dragEnd = this.items.map((items) =>
            Rx.Observable.merge.apply(
                undefined,
                items.map((item, itemIndex) =>
                    item.dragEnd.asObservable()
                )
            ) as Rx.Observable<void>
        ).switch().publish().refCount();

        this.itemsPositions = this.dragStart
            .withLatestFrom(this.items)
            .map(([_ds, items]) =>
                items.map(item => {
                    return { left: item.offsetLeft, width: item.offsetWidth };
                })
            ).publish().refCount();

        // Siblings of an item being dragged.
        this.itemSiblings = this.dragStart
            .withLatestFrom(this.items)
            .map(([dragStart, items]) =>
                items.filter(item => item !== dragStart.item)
            ).publish().refCount();

        this.targetIndex = this.drag
            .withLatestFrom(this.itemsPositions)
            .map(([drag, itemsPositions]) =>
                this._itemTargetIndex(
                    { left: drag.item.offsetLeft, width: drag.item.offsetWidth },
                    itemsPositions
                )
            ).distinctUntilChanged().publish().refCount();

        this.indexesChange = this.targetIndex
            .withLatestFrom(this.items)
            .withLatestFrom(this.drag)
            .map(([[targetIndex, items], drag]) =>
                items.map((item, i) => {
                    if (i >= targetIndex && i < drag.itemIndex) {
                        return 1;
                    } else if (i > drag.itemIndex && i <= targetIndex) {
                        return -1;
                    } else if (i === drag.itemIndex) {
                        return targetIndex - drag.itemIndex;
                    } else {
                        return 0;
                    }
                })
            ).publish().refCount();

        this.itemsLefts = this.indexesChange
            .withLatestFrom(this.items)
            .withLatestFrom(this.drag)
            .withLatestFrom(this.itemsMargin)
            .map(([[[indexes, items], drag], margin]) =>
                items.map((item, i) =>
                    Maybe.fromBool(
                        drag.item !== item, indexes[i] * (drag.item.offsetWidth + margin)))
            ).publish().refCount();

        // Notify item siblings about `drag start` event.
        this.dragStart
            .withLatestFrom(this.itemSiblings)
            .subscribe(([dragStart, siblings]) => {
                if (this.draggableListInlineEnable)
                    siblings.forEach(item => item.onSiblingDragStart());
            });

        // Modify items positions on drag.
        this.itemsLefts
            .withLatestFrom(this.items)
            .subscribe(([lefts, items]) =>
                items.forEach((item, i) =>
                    lefts[i].map(t => item.setLeft(t))));

        // Reset items positions on `drag end`.
        this.dragEnd
            .withLatestFrom(this.items)
            .subscribe(([dragEnd, items]) => {
                if (this.draggableListInlineEnable)
                    items.forEach(item => item.setLeft(0));
            });

        // Notify item siblings about `drag end` event.
        this.dragEnd
            .withLatestFrom(this.itemSiblings)
            .subscribe(([dragEnd, siblings]) => {
                if (this.draggableListInlineEnable)
                    siblings.forEach(item => item.onSiblingDragEnd());
            });

        // Emit new indexes on `drag end`.
        this.dragEnd
            .withLatestFrom(this.indexesChange)
            .subscribe(([dragEnd, indexes]) => {
                if (this.draggableListInlineEnable)
                    this.newIndexes.emit(indexes);
            });
    }

    /**
     * Calculate where item is being dragged.
     */
    public _itemTargetIndex(draggedItem: ItemPostion, otherItems: ItemPostion[]) {
        // if (!this.draggableListInline) return;
        function itemMiddle(item: ItemPostion) {
            return item.left + item.width / 2;
        }

        const first = otherItems[0];
        const intervals = [
            { left: 0, right: first.left + first.width / 2 }
        ];
        for (let i = 0, l = otherItems.length; i < l - 1 ; i++) {
            intervals.push({
                left: itemMiddle(otherItems[i]),
                right: itemMiddle(otherItems[i + 1])
            });
        }
        const last = otherItems[otherItems.length - 1];
        intervals.push({
            left: itemMiddle(last),
            right: last.left + last.width
        });

        let left = 0;
        let right: number;
        intervals.forEach((interval, i) => {
            if (draggedItem.left >= interval.left && draggedItem.left <= interval.right) {
                left = i;
            }

            const draggedItemBottom = draggedItem.left + draggedItem.width;
            if (draggedItemBottom >= interval.left && draggedItemBottom <= interval.right) {
                right = i;
            }
        });

        return left;
    }

    ngOnDestroy() {
    }
}
