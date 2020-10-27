import {
	Component, OnInit, Output, OnDestroy, EventEmitter, Input, ElementRef, ChangeDetectorRef, ViewChild
} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { DragSessionService, DragEvent, DragSession } from '@app-directives/drag-session/drag-session.service';

export type ResizeDirection =
	'top left'
	| 'top'
	| 'top right'
	| 'right'
	| 'bottom right'
	| 'bottom'
	| 'bottom left'
	| 'left'

export interface ResizeEvent extends DragEvent {
	direction: ResizeDirection;
}

/**
* Created dynamically by `ResizableDirective`. Not supposed to be used in templates.
*/
@Component({
	moduleId: module.id,
	templateUrl: 'resize-box.component.html',
	styleUrls: ['resize-box.component.css']
})
export class ResizeBoxComponent implements OnInit, OnDestroy {

	@Input() disp_measure = true;
	@Input() enabled = false;
	@Input() top = true;
	@Input() right = true;
	@Input() bottom = true;
	@Input() left = true;
	@Input() top_left = true;
	@Input() top_right = true;
	@Input() bottom_left = true;
	@Input() bottom_right = true;
	@Input() containerEle: HTMLElement;

	@Output() resizeStart = new EventEmitter<void>();
	@Output() resize = new EventEmitter<ResizeEvent>();
	@Output() resizeEnd = new EventEmitter<void>();

	@ViewChild('dpi') public dpi: ElementRef;

	public _dragSession: DragSession;
	public _ele: HTMLElement;
	public _initWidth: number;
	public _initHeight: number;
	public _width: number;
	public _height: number;
	public _dpiWidth: string;
	public _dpiHeight: string;
	public _dpiW: number;
	public _dpiH: number;
	public _dpiHMarginRight: number = -70;
	public _dpiShow: boolean = false;
	public _sub: Rx.Subscription;

	constructor(
		public _dragSessionService: DragSessionService,
		public _changeDetectorRef: ChangeDetectorRef,
		public _elementRef: ElementRef
	) { }

	ngOnInit() {
		let parentEle = (this._elementRef.nativeElement as HTMLElement).parentElement;
		let dpiEle = document.createElement('div');
		dpiEle.style.width = '1in';
		dpiEle.style.height = '1in';
		document.documentElement.appendChild(dpiEle);
		this._dpiW = dpiEle.offsetWidth;
		this._dpiH = dpiEle.offsetHeight;
		document.documentElement.removeChild(dpiEle);

		this._width = parentEle.offsetWidth;
		this._height = parentEle.offsetHeight;
		this._dpiWidth = (this._width / this._dpiW).toFixed(2);
		this._dpiHeight = (this._height / this._dpiH).toFixed(2);

		this._initWidth = this._width;
		this._initHeight = this._height;
	}

	startResize(direction: ResizeDirection, e: MouseEvent | TouchEvent) {
		if (!this.enabled)
			return;
		e.preventDefault();
		e.stopPropagation();

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

		this._dragSession = this._dragSessionService.startDrag(pageX, pageY);
		this._dpiShow = true;

		if (this._sub) { this._sub.unsubscribe(); }
		this._sub = this._dragSession.drag.subscribe(
			(dragEvent) => {
				// this._width = this._initWidth + (dragEvent.pageX - dragEvent.initialX);
				// this._height = this._initHeight + (dragEvent.pageY - dragEvent.initialY);
				let parentEle = (this._elementRef.nativeElement as HTMLElement).parentElement;
				this._width = parentEle.offsetWidth;
				this._height = parentEle.offsetHeight;
				this._dpiWidth = (this._width / this._dpiW).toFixed(2);
				this._dpiHeight = (this._height / this._dpiH).toFixed(2);
				this._dpiHMarginRight = this.containerEle ? parentEle.offsetLeft + parentEle.offsetWidth + 20 > this.containerEle.offsetWidth ? -40 : -70 : -70;
				this._changeDetectorRef.detectChanges();
				return this.resize.emit(Object.assign({}, dragEvent, { direction }));
			},
			() => { },
			() => this.resizeEnd.emit(undefined)
		);

		this.resizeStart.emit(undefined);
	}

	stopResize(e: MouseEvent | TouchEvent) {
		if (this._dragSession) {
			this._dragSession._onDragEnd(e);
		}

		// this.resizeEnd.emit(undefined);
	}

	ngOnDestroy() {
		if (this._dragSession) {
			this._dragSession.stopDrag();
		}

		this._dpiShow = false;

		if (this._sub) {
			this._sub.unsubscribe();
		}
	}
}
