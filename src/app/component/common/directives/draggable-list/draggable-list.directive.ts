import { Directive,  ContentChildren, AfterContentInit,
		 OnDestroy, QueryList, ElementRef, EventEmitter, Output, Input
	   } from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { Maybe } from '@app-lib/maybe/maybe';
import { elementRectPage } from '@app-lib/dom/dom';

import { DraggableListItemDirective } from '@app-directives/draggable-list/draggable-list-item.directive';

interface DragStartEvent {
	itemIndex: number;
	item: DraggableListItemDirective;
}

interface DragEvent {
	itemIndex: number;
	item: DraggableListItemDirective;
	deltaY: number;
}

interface ItemPostion {
	top: number;
	height: number;
}

@Directive({
	selector: '[draggableList]'
})
export class DraggableListDirective implements AfterContentInit, OnDestroy {
	get offsetHeight(): number {
		return (this._elementRef.nativeElement as HTMLElement).offsetHeight;
	}

	@ContentChildren(DraggableListItemDirective)
	public _queryList: QueryList<DraggableListItemDirective>;

	@Input () draggableListEnable = true;
	@Output('draggableList-newIndexes') readonly newIndexes = new EventEmitter<number[]>();

	items		 : Rx.Observable<DraggableListItemDirective[]>;
	itemsMargin   : Rx.Observable<number>;
	dragStart	 : Rx.Observable<DragStartEvent>;
	drag		  : Rx.Observable<DragEvent>;
	dragEnd	   : Rx.Observable<void>;
	itemsPositions: Rx.Observable<ItemPostion[]>;
	itemSiblings  : Rx.Observable<DraggableListItemDirective[]>;
	targetIndex   : Rx.Observable<number>;
	indexesChange : Rx.Observable<number[]>;
	itemsTops	 : Rx.Observable<Maybe<number>[]>;

	constructor (
		public readonly _elementRef: ElementRef
	) {}

	ngAfterContentInit() {
		this.items = this._queryList.changes
			.startWith(this._queryList)
			.map((x: QueryList<DraggableListItemDirective>) =>
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
					: elementRectPage(items[1].element).top - elementRectPage(items[0].element).bottom()
			).publish().refCount();

		this.drag = this.items.map((items) =>
			Rx.Observable.merge.apply(
				undefined,
				items.map((item, itemIndex) =>
					item.drag.asObservable().map<any, DragEvent>((deltaY: number) => {
						return { itemIndex, item, deltaY, offsetTop: item.offsetTop };
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
					items.map((item, i) => {
						return { top: item.offsetTop, height: item.offsetHeight };
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
					{ top: drag.item.offsetTop, height: drag.item.offsetHeight },
					itemsPositions
				)
			).distinctUntilChanged().publish().refCount();

		this.indexesChange = this.targetIndex
			.withLatestFrom(this.items)
			.withLatestFrom(this.drag)
			.map(([[_targetIndex, items], drag]) =>
				items.map((item, i) => {
					if (i >= _targetIndex && i < drag.itemIndex) {
						return 1;
					} else if (i > drag.itemIndex && i <= _targetIndex) {
						return -1;
					} else if (i === drag.itemIndex) {
						return _targetIndex - drag.itemIndex;
					} else {
						return 0;
					}
				})
			).publish().refCount();

		this.itemsTops = this.indexesChange
			.withLatestFrom(this.items)
			.withLatestFrom(this.drag)
			.withLatestFrom(this.itemsMargin)
			.map(([[[indexes, items], drag], margin]) =>
				items.map((item, i) =>
					Maybe.fromBool(
						drag.item !== item, indexes[i] * (drag.item.offsetHeight + margin)))
			).publish().refCount();

		// Notify item siblings about `drag start` event.
		this.dragStart
			.withLatestFrom(this.itemSiblings)
			.subscribe(([dragStart, siblings]) => {
				if (this.draggableListEnable)
					siblings.forEach(item => item.onSiblingDragStart());
			});

		// Modify items positions on drag.
		this.itemsTops
			.withLatestFrom(this.items)
			.subscribe(([tops, items]) =>
				items.forEach((item, i) =>
					tops[i].map(t => item.setTop(t))));

		// Reset items positions on `drag end`.
		this.dragEnd
			.withLatestFrom(this.items)
			.subscribe(([dragEnd, items]) => {
				if (this.draggableListEnable)
					items.forEach(item => item.setTop(0));
			});

		// Notify item siblings about `drag end` event.
		this.dragEnd
			.withLatestFrom(this.itemSiblings)
			.subscribe(([dragEnd, siblings]) => {
				if (this.draggableListEnable)
					siblings.forEach(item => item.onSiblingDragEnd());
			});

		// Emit new indexes on `drag end`.
		this.dragEnd
			.withLatestFrom(this.indexesChange)
			.subscribe(([dragEnd, indexes]) => {
				if (this.draggableListEnable)
					this.newIndexes.emit(indexes);
			});
	}

	/**
	 * Calculate where item is being dragged.
	 */
	public _itemTargetIndex(draggedItem: ItemPostion, otherItems: ItemPostion[]) {
		function itemMiddle(item: ItemPostion) {
			return item.top + item.height / 2;
		}

		const first = otherItems[0];
		const intervals = [
			{ top: 0, bottom: first.top + first.height / 2 }
		];
		for (let i = 0, l = otherItems.length; i < l - 1 ; i++) {
			intervals.push({
				top: itemMiddle(otherItems[i]),
				bottom: itemMiddle(otherItems[i + 1])
			});
		}
		const last = otherItems[otherItems.length - 1];
		intervals.push({
			top: itemMiddle(last),
			bottom: last.top + last.height
		});

		let top = 0;
		let bottom: number;
		intervals.forEach((interval, i) => {
			if (draggedItem.top >= interval.top && draggedItem.top <= interval.bottom) {
				top = i;
			}

			const draggedItemBottom = draggedItem.top + draggedItem.height;
			if (draggedItemBottom >= interval.top && draggedItemBottom <= interval.bottom) {
				bottom = i;
			}
		});

		return top;
	}

	ngOnDestroy() {
	}
}
