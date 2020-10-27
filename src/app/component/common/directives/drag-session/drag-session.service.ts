import { Injectable, Renderer } from '@angular/core';
import * as Rx from 'rxjs/Rx';

import { Maybe } from '@app-lib/maybe/maybe';

export interface DragEvent {
	/** X coordinate of the cursor realtive to the page. */
	pageX: number;
	/** Y coordinate of the cursor realtive to the page. */
	pageY: number;

	/** X coordinate of the cursor at the start of drag relative to the page. */
	initialX: number;
	/** Y coordinate of the cursor at the start of drag relative to the page. */
	initialY: number;

	/** Change of X coordinate of the cursor since start of drag. */
	deltaX: number;
	/** Change of Y coordinate of the cursor since start of drag. */
	deltaY: number;

	/** Change of X coordinate of the cursor since previous drag event. */
	deltaPrevX: number;
	/** Change of Y coordinate of the cursor since previous drag event. */
	deltaPrevY: number;

	mouseEvent: MouseEvent | Touch;
}

@Injectable()
export class DragSessionService {
	constructor() {}

	/**
	 * @param initialX X coordinate of the cursor at the start of drag relative to the page
	 * @param initialY Y coordinate of the cursor at the start of drag relative to the page
	 * @param dragCallback
	 * @param dragEndCallback
	 */
	startDrag(
		initialX: number,
		initialY: number
	) {
		return new DragSession(initialX, initialY);
	}
}

export class DragSession {
	get initialX() { return this._initialX; }
	get initialY() { return this._initialY; }

	public _deltaX: number;
	public _deltaY: number;

	public _prevX: number;
	public _prevY: number;

	public readonly _unsubMouseMove: Function;
	public readonly _unsubMouseUp: Function;

	public readonly _unsubTouchMove: Function;
	public readonly _unsubTouchEnd: Function;

	public readonly _drag = new Rx.BehaviorSubject<Maybe<DragEvent>>(Maybe.nothing<DragEvent>());
	get drag(): Rx.Observable<DragEvent> { return Maybe.filterJustObs(this._drag); }

	public readonly _dragEnd = new Rx.Subject<DragEvent>();
	get dragEnd(): Rx.Observable<DragEvent> { return this._dragEnd; }

	public _lastDrag: DragEvent;

	constructor(
		public readonly _initialX: number,
		public readonly _initialY: number
	) {

		this._deltaX = 0;
		this._deltaY = 0;
		this._prevX = _initialX;
		this._prevY = _initialY;

		const onMouseMove = (e: MouseEvent) => this._onDrag(e);
		const onMouseUp   = (e: MouseEvent) => this._onDragEnd(e);

		const onTouchMove = (e: TouchEvent) => this._onDrag(e);
		const onTouchEnd   = (e: TouchEvent) => this._onDragEnd(e);

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup'  , onMouseUp  );

		document.addEventListener('touchmove', onTouchMove);
		document.addEventListener('touchend' , onTouchEnd  );

		this._unsubMouseMove = () => document.removeEventListener('mousemove', onMouseMove);
		this._unsubMouseUp   = () => document.removeEventListener('mouseup', onMouseUp);

		this._unsubTouchMove = () => document.removeEventListener('touchmove', onTouchMove);
		this._unsubTouchEnd   = () => document.removeEventListener('touchend', onTouchEnd);
	}

	stopDrag() {
		this._stop();
	}

	public _onDrag(e: MouseEvent | TouchEvent) {
		e.stopPropagation();
    e.preventDefault();

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

		this._deltaX = pageX - this._initialX;
		this._deltaY = pageY - this._initialY;

		this._lastDrag = {
			pageX: pageX,
			pageY: pageY,
			initialX: this._initialX,
			initialY: this._initialY,
			deltaX: this._deltaX,
			deltaY: this._deltaY,
			deltaPrevX: pageX - this._prevX,
			deltaPrevY: pageY - this._prevY,
			mouseEvent: e instanceof MouseEvent ? e : e.changedTouches[0]
		};

		this._drag.next(Maybe.just(this._lastDrag));

		this._prevX = pageX;
		this._prevY = pageY;
	}

	public _stop(event?: MouseEvent | Touch) {
		if (event instanceof MouseEvent) {
			this._unsubMouseMove();
			this._unsubMouseUp();
		} else {
			this._unsubTouchMove();
			this._unsubTouchEnd();
		}


		if (!this._drag.closed) {
			this._drag.complete();
		}

		if (!this._dragEnd.closed) {
			const nextEvent = Object.assign({}, this._lastDrag, { mouseEvent: event });
			this._dragEnd.next(nextEvent);
			this._dragEnd.complete();
		}
	}

	public _onDragEnd(e: MouseEvent | TouchEvent) {
    e.stopPropagation();
    e.preventDefault();

		if (e instanceof MouseEvent) {
      this._stop(e);
		} else {
      this._stop(e.changedTouches[0]);
    }
	}
}
