// import {
//	 Directive,
//	 Input,
//	 Output,
//	 HostListener,
//	 OnDestroy,
//	 EventEmitter,
//	 Renderer,
//	 HostBinding,
//	 ElementRef,
//	 OnChanges,
//	 SimpleChanges,
//	 Injector,
//	 ComponentRef,
//	 ComponentFactoryResolver,
//	 OnInit
// } from "@angular/core";
// import * as lodash from "lodash";
// import * as Rx from "rxjs/Rx";
// import "rxjs/add/operator/pairwise";
// import "@app-lib/rx/rx";

// import {
//	 DragSessionService,
//	 DragEvent,
//	 DragSession
// } from "@app-directives/drag-session/drag-session.service";
// import { Box, Rect } from "@app-lib/rect/rect";
// import {
//	 SmartGuidesComponent,
//	 ElementBox,
//	 findSnapElements,
//	 snapHorizontal,
//	 snapVertical,
//	 SnapEvent
// } from "@app-directives/smart-guides/smart-guides.component";
// import { forwardObs, animationFrameObs } from "@app-lib/rx/rx";
// import { elemOffsetLeft, elemOffsetTop } from "@app-lib/dom/dom";
// import { Maybe } from "@app-lib/maybe/maybe";

// export { DragEvent } from "@app-directives/drag-session/drag-session.service";

// @Directive({
//	 selector: "[draggable]",
//	 providers: [DragSessionService],
//	 exportAs: "draggable"
// })
// export class DraggableDirective implements OnChanges, OnDestroy, OnInit {
//	 /** Is dragging enabled? */
//	 @Input("draggable-enabled")
//	 enabled = false;

//	 /** Is dragging along X axis enabled? */
//	 @Input("draggable-alongX")
//	 alongX: boolean = true;
//	 /** Is dragging along Y axis enabled? */
//	 @Input("draggable-alongY")
//	 alongY: boolean = true;

//	 /** Minimum value of the left offset of the host element. */
//	 @Input("draggable-minLeft")
//	 minLeft: number = -Infinity;
//	 /** Maximum value of the left offset of the host element. */
//	 @Input("draggable-maxLeft")
//	 maxLeft: number = Infinity;
//	 /** Minimum value of the top offset of the host element. */
//	 @Input("draggable-minTop")
//	 minTop: number = -Infinity;
//	 /** Maximum value of the top offset of the host element. */
//	 @Input("draggable-maxTop")
//	 maxTop: number = Infinity;

//	 /** Should contain the host element inside its parent? */
//	 @Input("draggable-keepInParent")
//	 keepInParent: boolean = false;

//	 /** Is snap enabled? */
//	 @Input("draggable-snapEnabled")
//	 snapEnabled: boolean = true;
//	 /** Distance between the host element and snap elements at which snap triggers. */
//	 @Input("draggable-snapTolerance")
//	 snapTolerance: number = 0;
//	 /** CSS selector specifying which elements to snap to. */
//	 @Input("draggable-snapSelector")
//	 snapSelector: string = "*";

//	 @Input("draggable-cursor")
//	 cursor: string = "move";

//	 /** Ancestor element with scroll bar. */
//	 @Input("draggable-scrollContainer")
//	 scrollContainer: HTMLElement;
//	 /** Scrolling speed in pixels pre second. */
//	 @Input("draggable-scrollStep")
//	 scrollSpeed: number = 1;

//	 @Input("draggable-targetClass")
//	 targetClass: string = "";

//	 /** Fires when element is beign dragged. */
//	 @Output("draggable-dragStart")
//	 readonly dragStart = new EventEmitter<DragSession>();
//	 /** Fires when element is beign dragged. */
//	 @Output("draggable-drag")
//	 readonly drag = new EventEmitter<Box>();
//	 /** Fires when drag ends. */
//	 @Output("draggable-dragEnd")
//	 readonly dragEnd = new EventEmitter<Box>();

//	 @HostBinding("style.left")
//	 styleLeft: string;
//	 @HostBinding("style.top")
//	 styleTop: string;

//	 @HostBinding("style.cursor")
//	 get styleCursor(): string {
//	 return this.enabled
//		 ? this.alongX && this.alongY
//		 ? this._initCursor
//		 : !this.alongX && this.alongY
//			 ? "row-resize"
//			 : "col-resize"
//		 : "inherit";
//	 }

//	 public readonly _dragSession = new Rx.BehaviorSubject<Maybe<DragSession>>(
//	 Maybe.nothing<DragSession>()
//	 );
//	 public _drag: Rx.Observable<DragEvent>;
//	 public _dragEnd: Rx.Observable<void>;
//	 public _dragging: Rx.Observable<boolean>;

//	 public readonly _subs: Rx.Subscription[] = [];

//	 /** Elements to snap to. */
//	 public _snapElems: Rx.Observable<ElementBox[]>;

//	 /** Host element. */
//	 public _elem: HTMLElement;
//	 /** Parent element. */
//	 public _parent: HTMLElement;

//	 public _targetLeft: Rx.Observable<number>;
//	 public _targetTop: Rx.Observable<number>;
//	 public _left: Rx.Observable<number>;
//	 public _top: Rx.Observable<number>;

//	 /** Size of the host element. */
//	 public _box: Rx.Observable<Box>;
//	 public _rect: Rx.Observable<Rect>;

//	 public _smartGuides = Maybe.nothing<ComponentRef<SmartGuidesComponent>>();
//	 public _smartGuidesContainer = Maybe.nothing<HTMLElement>();

//	 /** Fires when item is dragged to the top or bottom edge of the scrollContainer. */
//	 public _scrollY: Rx.Observable<number>;

//	 public _snapEventsX: Rx.Observable<SnapEvent[]>;
//	 public _snapEventsY: Rx.Observable<SnapEvent[]>;

//	 public _initCursor: string = "move";
//	 public _initialized = false;

//	 constructor(
//	 public readonly _renderer: Renderer,
//	 public readonly _dragSessionService: DragSessionService,
//	 public readonly _elementRef: ElementRef,
//	 public readonly _resolver: ComponentFactoryResolver,
//	 public readonly _injector: Injector
//	 ) {}

//	 ngOnInit() {
//	 this._elem = this._elementRef.nativeElement as HTMLElement;
//	 this._parent = this._elem.parentElement as HTMLElement;

//	 if (this.targetClass.length > 0) this.cursor = "inherit";

//	 const dragStart = Maybe.filterJustObs(
//		 this._dragSession
//	 ).distinctUntilChanged();

//	 this._dragEnd = dragStart
//		 .map(
//		 s =>
//			 s.drag
//			 .ignoreElements()
//			 .concat(Rx.Observable.of<void>(undefined)) as Rx.Observable<void>
//		 )
//		 .switch(); // {}

//	 this._dragging = dragStart
//		 .map(() => true)
//		 .merge(this._dragEnd.map(() => false));

//	 this._drag = dragStart.map(s => s.drag).switch(); // {}

//	 /**
//		* For each drag session start from the given value
//		* and accumulate mouse movements along X axis.
//		*/
//	 this._targetLeft = dragStart
//		 .map(s =>
//		 s.drag
//			 .scan(
//			 (acc, drag) => acc + drag.deltaPrevX,
//			 elemOffsetLeft(this._elem)
//			 )
//			 .startWith(elemOffsetLeft(this._elem))
//		 )
//		 .switch() // {}
//		 .publish()
//		 .refCount();

//	 this._targetTop = dragStart
//		 .map(s =>
//		 s.drag
//			 .map(drag => drag.deltaPrevY)
//			 // Move along with scroll.
//			 .merge(forwardObs(() => this._scrollY))
//			 .scan((acc, dy) => acc + dy, elemOffsetTop(this._elem))
//			 .startWith(elemOffsetTop(this._elem))
//		 )
//		 .switch() // {}
//		 .publish()
//		 .refCount();

//	 this._snapElems = dragStart
//		 .map(
//		 () =>
//			 this.snapEnabled
//			 ? findSnapElements(this._elem, this.snapSelector)
//			 : []
//		 )
//		 .publish()
//		 .refCount();

//	 const restrictAxis = (side: Rx.Observable<number>, axis: "x" | "y") =>
//		 side
//		 .filter(() => (axis === "x" ? this.alongX : this.alongY))
//		 .publish()
//		 .refCount();

//	 const restrictRange = (
//		 sideObs: Rx.Observable<number>,
//		 min: () => number,
//		 max: () => number
//	 ) =>
//		 sideObs
//		 .map(side => lodash.clamp(side, min(), max()))
//		 .publish()
//		 .refCount();

//	 const restrictParent = (sideObs: Rx.Observable<number>, axis: "x" | "y") =>
//		 sideObs
//		 .map(
//			 side =>
//			 this.keepInParent
//				 ? lodash.clamp(
//					 side,
//					 axis === "x"
//					 ? lodash.min([
//						 0,
//						 this._elem.offsetLeft - this.rotatedPosition().left
//						 ])
//					 : this._elem.offsetTop - this.rotatedPosition().top,
//					 axis === "x"
//					 ? this._parent.offsetWidth -
//						 this._elem.offsetWidth -
//						 this._elem.offsetLeft +
//						 this.rotatedPosition().left
//					 : this._parent.offsetHeight -
//						 this._elem.offsetHeight -
//						 this._elem.offsetTop +
//						 this.rotatedPosition().top
//				 )
//				 : side
//		 )
//		 .publish()
//		 .refCount();

//	 /** Check if in range of any snaps. */
//	 const snapOpportunities = (
//		 sideObs: Rx.Observable<number>,
//		 axis: "x" | "y"
//	 ) =>
//		 sideObs
//		 .withLatestFrom(this._snapElems)
//		 .map(([side, snapElems]) => {
//			 const [length, snapFn] =
//			 axis === "x"
//				 ? [this._elem.offsetWidth, snapHorizontal]
//				 : [this._elem.offsetHeight, snapVertical];

//			 const low = snapFn(side, snapElems, this.snapTolerance);
//			 const center = snapFn(
//			 Math.floor(side + length / 2),
//			 snapElems,
//			 this.snapTolerance
//			 );
//			 const high = snapFn(side + length, snapElems, this.snapTolerance);

//			 return [...low, ...center, ...high];
//		 })
//		 .publish()
//		 .refCount();

//	 /** Choose closest snaps. */
//	 const snapEvents = (
//		 sideObs: Rx.Observable<number>,
//		 snapOpportunitiesObs: Rx.Observable<SnapEvent[]>,
//		 axis: "x" | "y"
//	 ) =>
//		 sideObs
//		 .withLatestFrom(snapOpportunitiesObs)
//		 .withLatestFrom(this._drag)
//		 .map(([[_side, events], drag]) => {
//			 if (events.length === 0) {
//			 return [];
//			 }

//			 const deltaPrev = axis === "x" ? drag.deltaPrevX : drag.deltaPrevY;

//			 const snapGroups = lodash.mapValues(
//			 lodash.groupBy(events, e => e.distance),
//			 (evs, distance) => evs.sort((e0, e1) => deltaPrev)
//			 );

//			 const minDistance = Object.keys(snapGroups).sort(
//			 (a, b) => parseInt(a, 10) - parseInt(b, 10)
//			 )[0];

//			 return snapGroups[minDistance];
//		 })
//		 .publish()
//		 .refCount();

//	 /** Move side to the snap. */
//	 const snapSide = (
//		 sideObs: Rx.Observable<number>,
//		 snapEventsObs: Rx.Observable<SnapEvent[]>
//	 ) =>
//		 sideObs
//		 .withLatestFrom(snapEventsObs)
//		 .map(
//			 ([side, snapEvent]) =>
//			 side + (snapEvent.length > 0 ? snapEvent[0].distance : 0)
//		 )
//		 .publish()
//		 .refCount();

//	 const left = restrictParent(
//		 restrictRange(
//		 restrictAxis(this._targetLeft, "x"),
//		 () => this.minLeft,
//		 () => this.maxLeft
//		 ),
//		 "x"
//	 );
//	 const top = restrictParent(
//		 restrictRange(
//		 restrictAxis(this._targetTop, "y"),
//		 () => this.minTop,
//		 () => this.maxTop
//		 ),
//		 "y"
//	 );

//	 this._snapEventsX = snapEvents(left, snapOpportunities(left, "x"), "x");
//	 this._snapEventsY = snapEvents(top, snapOpportunities(top, "y"), "y");

//	 this._left = dragStart
//		 .map(() => elemOffsetLeft(this._elem))
//		 .merge(snapSide(left, this._snapEventsX));
//	 this._top = dragStart
//		 .map(() => elemOffsetTop(this._elem))
//		 .merge(snapSide(top, this._snapEventsY));

//	 this._box = this._left
//		 .combineLatest(this._top)
//		 .map(
//		 ([_left, _top]) =>
//			 new Box(
//			 _left,
//			 _left + this._elem.offsetWidth,
//			 _top,
//			 _top + this._elem.offsetHeight
//			 )
//		 )
//		 .publish()
//		 .refCount();

//	 this._rect = this._box
//		 .map(b => b.toRect())
//		 .publish()
//		 .refCount();

//	 const scrollDirection = this._top
//		 .pairwise()
//		 .filter(() => !!this.scrollContainer)
//		 .map(([prev, _top]) => {
//		 const delta = _top - prev;
//		 if (delta == 0 && this.scrollContainer.scrollTop == 0) return undefined;
//		 if (delta < 0 && _top < this.scrollContainer.scrollTop) {
//			 return -1;
//		 }

//		 let bottom = _top;
//		 if (this._elem.offsetHeight > this.scrollContainer.clientHeight)
//			 bottom = bottom + this._elem.offsetHeight / 2;
//		 else bottom = bottom + this._elem.offsetHeight;
//		 /** Position of the bottom edge of the scroll box relative to the canvas. */
//		 // const scrollBottom = this.scrollContainer.scrollTop + this.scrollContainer.offsetHeight;
//		 const scrollBottom =
//			 this.scrollContainer.scrollTop + this.scrollContainer.clientHeight;
//		 if (delta > 0 && bottom >= scrollBottom) {
//			 return 1;
//		 }
//		 return undefined;
//		 })
//		 .merge(this._dragEnd.map<any, number | undefined>(() => undefined))
//		 .distinctUntilChanged()
//		 .publish()
//		 .refCount();

//	 this._scrollY = scrollDirection
//		 .map(
//		 scrollDir =>
//			 scrollDir === undefined
//			 ? Rx.Observable.never<number>()
//			 : animationFrameObs()
//				 .pairwise()
//				 .map(([t0, t1]) => {
//					 return Math.round(scrollDir * this.scrollSpeed * (t1 - t0));
//				 })
//		 )
//		 .switch() // {}
//		 .publish()
//		 .refCount();

//	 this._subs.push(
//		 this._left.subscribe(l => {
//		 this.styleLeft = l + "px";
//		 }),
//		 this._top.subscribe(t => {
//		 this.styleTop = t + "px";
//		 }),

//		 dragStart.subscribe(s => this.dragStart.emit(s)),

//		 // Subscribe to `_drag` event, not to `_box` directly because `_box` fires
//		 // before `_drag`.
//		 this._drag
//		 .withLatestFrom(this._box)
//		 .subscribe(([_e, b]) => this.drag.emit(b)),

//		 this._dragEnd.withLatestFrom(this._box).subscribe(([_e, b]) => {
//		 this.dragEnd.emit(b);
//		 }),

//		 this._scrollY.subscribe(scrollY => {
//		 this.scrollContainer.scrollTop += scrollY;
//		 })
//	 );

//	 this._initialized = true;
//	 if (this.enabled) {
//		 this._createSmartGuides();
//	 }
//	 }

//	 ngOnChanges(changes: SimpleChanges) {
//	 const ch = changes["enabled"];
//	 if (ch && ch.currentValue && this._initialized) {
//		 this._createSmartGuides();
//	 } else if (ch && !ch.currentValue) {
//		 this._destroySmartGuides();
//	 }
//	 }

//	 /**
//	* Dynamically load SmartGuidesComponent.
//	*/
//	 public _createSmartGuides() {
//	 const factory = this._resolver.resolveComponentFactory(
//		 SmartGuidesComponent
//	 );
//	 this._smartGuidesContainer = Maybe.just(
//		 this._renderer.createElement(this._elem, "div")
//	 );
//	 this._smartGuides = this._smartGuidesContainer.map(elem =>
//		 factory.create(this._injector, [], elem)
//	 );
//	 this._smartGuides.map(sg => {
//		 sg.instance.snapElements = this._snapElems;
//		 sg.instance.elementBox = this._box;
//		 sg.instance.snapEventsX = this._snapEventsX;
//		 sg.instance.snapEventsY = this._snapEventsY;
//		 sg.instance.show = this._dragging;

//		 sg.instance.updateSubscriptions();
//		 sg.changeDetectorRef.detectChanges();

//		 sg.onDestroy(() => {
//		 sg.changeDetectorRef.detach();
//		 });
//	 });
//	 }

//	 /**
//	* Destroy SmartGuidesComponent.
//	*/
//	 public _destroySmartGuides() {
//	 this._smartGuides.map(sg => {
//		 sg.destroy();
//		 this._smartGuides = Maybe.nothing<ComponentRef<SmartGuidesComponent>>();
//	 });
//	 this._smartGuidesContainer.map(elem => {
//		 if (elem.parentNode) {
//		 elem.parentNode.removeChild(elem);
//		 }
//		 this._smartGuidesContainer = Maybe.nothing<HTMLElement>();
//	 });
//	 }

//	 rotatedPosition() {
//	 let pLeft = this._elem.offsetLeft;
//	 let pTop = this._elem.offsetTop;

//	 let angle = this.getAngle();
//	 if (angle == 0)
//		 return {
//		 left: pLeft,
//		 right: pLeft + this._elem.offsetWidth,
//		 top: pTop,
//		 bottom: pTop + this._elem.offsetHeight
//		 };

//	 let oLeft = pLeft + this._elem.offsetWidth / 2;
//	 let oTop = pTop + this._elem.offsetHeight / 2;
//	 let x = pLeft - oLeft;
//	 let y = pTop - oTop;
//	 let cos = Math.cos(angle);
//	 let sin = Math.sin(angle);

//	 let xRot0 = x * cos - y * sin + oLeft;
//	 let yRot0 = x * sin + y * cos + oTop;
//	 let xRot1 = -1 * x * cos - y * sin + oLeft;
//	 let yRot1 = -1 * x * sin + y * cos + oTop;
//	 let xRot2 = -1 * x * cos + y * sin + oLeft;
//	 let yRot2 = -1 * x * sin - y * cos + oTop;
//	 let xRot3 = x * cos + y * sin + oLeft;
//	 let yRot3 = x * sin - y * cos + oTop;

//	 return {
//		 left: lodash.min([xRot0, xRot1, xRot2, xRot3]),
//		 right: lodash.max([xRot0, xRot1, xRot2, xRot3]),
//		 top: lodash.min([yRot0, yRot1, yRot2, yRot3]),
//		 bottom: lodash.max([yRot0, yRot1, yRot2, yRot3])
//	 };
//	 }

//	 public getAngle() {
//	 try {
//		 let st = getComputedStyle(this._elem, null);
//		 let tr =
//		 st.getPropertyValue("-webkit-transform") ||
//		 st.getPropertyValue("-moz-transform") ||
//		 st.getPropertyValue("-ms-transform") ||
//		 st.getPropertyValue("-o-transform") ||
//		 st.getPropertyValue("transform") ||
//		 "FAIL";

//		 if (tr == "FAIL" || !tr) return 0;

//		 let values = tr
//		 .split("(")[1]
//		 .split(")")[0]
//		 .split(",");

//		 let a = parseFloat(values[0]); // 0.866025
//		 let b = parseFloat(values[1]); // 0.5
//		 let c = parseFloat(values[2]); // -0.5
//		 let d = parseFloat(values[3]); // 0.866025
//		 let scale = Math.sqrt(a * a + b * b);
//		 var sin = b / scale;
//		 // let angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
//		 let angle = Math.atan2(b, a);
//		 return angle;
//	 } catch (e) {
//		 return 0;
//	 }
//	 }

//	 /**
//	* Start dragging on mousedown.
//	*/
//	 @HostListener("mousedown", ["$event"])
//	 onDragStart(event: MouseEvent) {
//	 if (!this.enabled || event.button !== 0) {
//		 return;
//	 }
//	 if (
//		 this._elem.offsetTop > 10 &&
//		 this.targetClass &&
//		 event.srcElement.className.indexOf(this.targetClass) < 0
//	 )
//		 return;
//	 event.stopPropagation();
//	 event.preventDefault();

//	 this._dragSession.next(
//		 Maybe.just(this._dragSessionService.startDrag(event.pageX, event.pageY))
//	 );
//	 }

//	 @HostListener("mouseover", ["$event"])
//	 onMouseOver(event: MouseEvent) {
//	 if (this._elem.offsetTop < 10 && this._initCursor != "move")
//		 this._initCursor = "move";
//	 else if (this._initCursor != this.cursor) this._initCursor = this.cursor;
//	 }

//	 ngOnDestroy() {
//	 this._dragSession.value.map(ds => ds.stopDrag());
//	 this._subs.forEach(s => s.unsubscribe());
//	 }
// }


import {
	Directive,
	Input,
	Output,
	HostListener,
	OnDestroy,
	EventEmitter,
	Renderer,
	HostBinding,
	ElementRef,
	OnChanges,
	SimpleChanges,
	Injector,
	ComponentRef,
	ComponentFactoryResolver,
	OnInit
} from "@angular/core";
import * as lodash from "lodash";
import { Observable, BehaviorSubject } from "rxjs";
import { Subscription } from "rxjs/Subscription";

import { Box, Rect } from "@app-lib/rect/rect";
import { forwardObs, animationFrameObs } from "@app-lib/rx/rx";
import { elemOffsetLeft, elemOffsetTop } from "@app-lib/dom/dom";
import { Maybe } from "@app-lib/maybe/maybe";
import {
	SmartGuidesComponent,
	ElementBox,
	findSnapElements,
	snapHorizontal,
	snapVertical,
	SnapEvent
} from "@app-directives/smart-guides/smart-guides.component";
import { DragSessionService, DragEvent, DragSession } from "../drag-session/drag-session.service";

export { DragEvent } from "../drag-session/drag-session.service";

@Directive({
	selector: "[draggable]",
	providers: [DragSessionService],
	exportAs: "draggable"
})
export class DraggableDirective implements OnChanges, OnDestroy, OnInit {
	/** Is dragging enabled? */
	@Input("draggable-enabled") enabled = false;

	/** Is dragging along X axis enabled? */
	@Input("draggable-alongX") alongX: boolean = true;
	/** Is dragging along Y axis enabled? */
	@Input("draggable-alongY") alongY: boolean = true;

	/** Minimum value of the left offset of the host element. */
	@Input("draggable-minLeft") minLeft: number = -Infinity;
	/** Maximum value of the left offset of the host element. */
	@Input("draggable-maxLeft") maxLeft: number = Infinity;
	/** Minimum value of the top offset of the host element. */
	@Input("draggable-minTop") minTop: number = -Infinity;
	/** Maximum value of the top offset of the host element. */
	@Input("draggable-maxTop") maxTop: number = Infinity;

	/** Should contain the host element inside its parent? */
	@Input("draggable-keepInParent") keepInParent: {
		top?: boolean,
		bottom?: boolean,
		left?: boolean,
		right?: boolean
	} = null;

	/** Is snap enabled? */
	@Input("draggable-snapEnabled") snapEnabled: boolean = true;
	/** Distance between the host element and snap elements at which snap triggers. */
	@Input("draggable-snapTolerance") snapTolerance: number = 0;
	/** CSS selector specifying which elements to snap to. */
	@Input("draggable-snapSelector") snapSelector: string = "*";

	@Input("draggable-cursor") cursor: string = "move";

	/** Ancestor element with scroll bar. */
	@Input("draggable-scrollContainer") scrollContainer: HTMLElement;
	/** Scrolling speed in pixels pre second. */
	@Input("draggable-scrollStep") scrollSpeed: number = 1;

	@Input("draggable-targetClass") targetClass: string = "";

	/** Fires when element is beign dragged. */
	@Output("draggable-dragStart") readonly dragStart = new EventEmitter<DragSession>();
	/** Fires when element is beign dragged. */
	@Output("draggable-drag") readonly drag = new EventEmitter<Box>();
	/** Fires when drag ends. */
	@Output("draggable-dragEnd") readonly dragEnd = new EventEmitter<Box>();

	@HostBinding("style.cursor") get styleCursor(): string {
		return this.enabled
			? this.alongX && this.alongY
				? this._initCursor
				: !this.alongX && this.alongY
				? "row-resize"
				: "col-resize"
			: "inherit";
	}

	public readonly _dragSession = new BehaviorSubject<Maybe<DragSession>>(
		Maybe.nothing<DragSession>()
	);
	public _drag: Observable<DragEvent>;
	public _dragEnd: Observable<void>;
	public _dragging: Observable<boolean>;

	public readonly _subs: Subscription[] = [];

	/** Elements to snap to. */
	public _snapElems: Observable<ElementBox[]>;

	/** Host element. */
	public _elem: HTMLElement;
	/** Parent element. */
	public _parent: HTMLElement;

	public _targetLeft: Observable<number>;
	public _targetTop: Observable<number>;
	public _left: Observable<number>;
	public _top: Observable<number>;

	/** Size of the host element. */
	public _box: Observable<Box>;
	public _rect: Observable<Rect>;

	public _smartGuides = Maybe.nothing<ComponentRef<SmartGuidesComponent>>();
	public _smartGuidesContainer = Maybe.nothing<HTMLElement>();

	/** Fires when item is dragged to the top or bottom edge of the scrollContainer. */
	public _scrollY: Observable<any>;

	public _snapEventsX: Observable<SnapEvent[]>;
	public _snapEventsY: Observable<SnapEvent[]>;

	public _initCursor: string = "move";
	public _initialized = false;

	constructor(
		public readonly _renderer: Renderer,
		public readonly _dragSessionService: DragSessionService,
		public readonly _elementRef: ElementRef,
		public readonly _resolver: ComponentFactoryResolver,
		public readonly _injector: Injector
	) {}

	ngOnInit() {
		this._elem = this._elementRef.nativeElement as HTMLElement;
		this._parent = this._elem.parentElement as HTMLElement;

		if (this.targetClass.length > 0) this.cursor = "inherit";

		const dragStart = Maybe.filterJustObs(
			this._dragSession
		).distinctUntilChanged();

		this._dragEnd = dragStart
			.map(
				s =>
					s.drag
						.ignoreElements()
						.concat(Observable.of<void>(undefined)) as Observable<void>
			)
			.switch(); // {}

		this._dragging = dragStart
			.map(() => true)
			.merge(this._dragEnd.map(() => false));

		this._drag = dragStart.map(s => s.drag).switch(); // {}

		/**
		 * For each drag session start from the given value
		 * and accumulate mouse movements along X axis.
		 */
		this._targetLeft = dragStart
			.map(s =>
				s.drag
					.scan(
						(acc, drag) => acc + drag.deltaPrevX,
						elemOffsetLeft(this._elem)
					)
					.startWith(elemOffsetLeft(this._elem))
			)
			.switch() // {}
			.publish()
			.refCount();

		this._targetTop = dragStart
			.map(s =>
				s.drag
					.map(drag => drag.deltaPrevY)
					// Move along with scroll.
					.merge(forwardObs(() => this._scrollY))
					.scan((acc, dy) => acc + dy, elemOffsetTop(this._elem))
					.startWith(elemOffsetTop(this._elem))
			)
			.switch() // {}
			.publish()
			.refCount();

		this._snapElems = dragStart
			.map(() =>
				this.snapEnabled
					? findSnapElements(this._elem, this.snapSelector)
					: []
			)
			.publish()
			.refCount();

		const restrictAxis = (side: Observable<number>, axis: "x" | "y") =>
			side
				.filter(() => (axis === "x" ? this.alongX : this.alongY))
				.publish()
				.refCount();

		const restrictRange = (
			sideObs: Observable<number>,
			min: () => number,
			max: () => number
		) =>
			sideObs
				.map(side => lodash.clamp(side, min(), max()))
				.publish()
				.refCount();

		const restrictParent = (sideObs: Observable<number>, axis: "x" | "y") =>
			sideObs
				.map(side => {
					if (this.keepInParent) {
						const rotatedPosition = this.rotatedPosition();
						let minValue = lodash.max([0, side]);
						let maxValue = lodash.max([0, side]);

						if (axis == 'x') {
							if (this.keepInParent.left) {
								minValue = lodash.max([0, this._elem.offsetLeft - rotatedPosition.left]);
							}
							if (this.keepInParent.right) {
								maxValue = this._parent.offsetWidth - this._elem.offsetWidth - this._elem.offsetLeft + rotatedPosition.left;
							}
						} else {
							if (this.keepInParent.top) {
								minValue = lodash.max([0, this._elem.offsetTop - rotatedPosition.top]);
							}
							if (this.keepInParent.bottom) {
								maxValue = this._parent.offsetHeight - this._elem.offsetHeight - this._elem.offsetTop + rotatedPosition.top;
							}
						}
						return lodash.clamp(side, minValue, maxValue);
					}

					return side;
				})
				.publish()
				.refCount();

		/** Check if in range of any snaps. */
		const snapOpportunities = (
			sideObs: Observable<number>,
			axis: "x" | "y"
		) =>
			sideObs
				.withLatestFrom(this._snapElems)
				.map(([side, snapElems]) => {
					const [length, snapFn] =
						axis === "x"
							? [this._elem.offsetWidth, snapHorizontal]
							: [this._elem.offsetHeight, snapVertical];

					const low = snapFn(side, snapElems, this.snapTolerance);
					const center = snapFn(
						Math.floor(side + length / 2),
						snapElems,
						this.snapTolerance
					);
					const high = snapFn(
						side + length,
						snapElems,
						this.snapTolerance
					);

					return [...low, ...center, ...high];
				})
				.publish()
				.refCount();

		/** Choose closest snaps. */
		const snapEvents = (
			sideObs: Observable<number>,
			snapOpportunitiesObs: Observable<SnapEvent[]>,
			axis: "x" | "y"
		) =>
			sideObs
				.withLatestFrom(snapOpportunitiesObs)
				.withLatestFrom(this._drag)
				.map(([[_side, events], drag]) => {
					if (events.length === 0) {
						return [];
					}

					const deltaPrev =
						axis === "x" ? drag.deltaPrevX : drag.deltaPrevY;

					const snapGroups = lodash.mapValues(
						lodash.groupBy(events, e => e.distance),
						(evs, distance) => evs.sort((e0, e1) => deltaPrev)
					);

					const minDistance = Object.keys(snapGroups).sort(
						(a, b) => parseInt(a, 10) - parseInt(b, 10)
					)[0];

					return snapGroups[minDistance];
				})
				.publish()
				.refCount();

		/** Move side to the snap. */
		const snapSide = (
			sideObs: Observable<number>,
			snapEventsObs: Observable<SnapEvent[]>
		) =>
			sideObs
				.withLatestFrom(snapEventsObs)
				.map(
					([side, snapEvent]) =>
						side +
						(snapEvent.length > 0 ? snapEvent[0].distance : 0)
				)
				.publish()
				.refCount();

		const left = restrictParent(
			restrictRange(
				restrictAxis(this._targetLeft, "x"),
				() => this.minLeft,
				() => this.maxLeft
			),
			"x"
		);
		const top = restrictParent(
			restrictRange(
				restrictAxis(this._targetTop, "y"),
				() => this.minTop,
				() => this.maxTop
			),
			"y"
		);

		this._snapEventsX = snapEvents(left, snapOpportunities(left, "x"), "x");
		this._snapEventsY = snapEvents(top, snapOpportunities(top, "y"), "y");

		this._left = dragStart
			.map(() => elemOffsetLeft(this._elem))
			.merge(snapSide(left, this._snapEventsX));

		this._top = dragStart
			.map(() => elemOffsetTop(this._elem))
			.merge(snapSide(top, this._snapEventsY));

		this._box = this._left
			.combineLatest(this._top)
			.map(
				([_left, _top]) =>
					new Box(
						_left,
						_left + this._elem.offsetWidth,
						_top,
						_top + this._elem.offsetHeight
					)
			)
			.publish()
			.refCount();

		this._rect = this._box
			.map(b => b.toRect())
			.publish()
			.refCount();

		const scrollDirection = this._top
			.pairwise()
			.filter(() => !!this.scrollContainer)
			.map(([prev, _top]) => {
				const delta = _top - prev;
				if (delta == 0 && this.scrollContainer.scrollTop == 0)
					return undefined;
				if (delta < 0 && _top < this.scrollContainer.scrollTop) {
					return -1;
				}

				let bottom = _top;
				if (this._elem.offsetHeight > this.scrollContainer.clientHeight)
					bottom = bottom + this._elem.offsetHeight / 2;
				else bottom = bottom + this._elem.offsetHeight;
				/** Position of the bottom edge of the scroll box relative to the canvas. */
				// const scrollBottom = this.scrollContainer.scrollTop + this.scrollContainer.offsetHeight;
				const scrollBottom =
					this.scrollContainer.scrollTop +
					this.scrollContainer.clientHeight;
				if (delta > 0 && bottom >= scrollBottom) {
					return 1;
				}
				return undefined;
			})
			.merge(this._dragEnd.map<any, number | undefined>(() => undefined))
			.distinctUntilChanged()
			.publish()
			.refCount();

		this._scrollY = scrollDirection
			.map(scrollDir =>
				scrollDir === undefined
					? Observable.never()
					: animationFrameObs()
						.pairwise()
						.map(([t0, t1]) => {
							return Math.round(
								scrollDir * this.scrollSpeed * (t1 - t0)
							);
						})
			)
			.switch() // {}
			.publish()
			.refCount();

		this._subs.push(

			this._rect.subscribe(r => {
				this._elem.style.left = r.left + 'px';
				this._elem.style.top = r.top + 'px';
			}),

			dragStart.subscribe(s => this.dragStart.emit(s)),

			// Subscribe to `_drag` event, not to `_box` directly because `_box` fires
			// before `_drag`.
			this._drag
				.withLatestFrom(this._box)
				.subscribe(([_e, b]) => this.drag.emit(b)),

			this._dragEnd.withLatestFrom(this._box).subscribe(([_e, b]) => {
				this.dragEnd.emit(b);
			}),

			this._scrollY.subscribe(scrollY => {
				this.scrollContainer.scrollTop += scrollY;
			})
		);

		this._initialized = true;
		if (this.enabled) {
			this._createSmartGuides();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		const ch = changes["enabled"];
		if (ch && ch.currentValue && this._initialized) {
			this._createSmartGuides();
		} else if (ch && !ch.currentValue) {
			this._destroySmartGuides();
		}
	}

	/**
	 * Dynamically load SmartGuidesComponent.
	 */
	public _createSmartGuides() {
		const factory = this._resolver.resolveComponentFactory(
			SmartGuidesComponent
		);
		this._smartGuidesContainer = Maybe.just(
			this._renderer.createElement(this._elem, "div")
		);
		this._smartGuides = this._smartGuidesContainer.map(elem =>
			factory.create(this._injector, [], elem)
		);
		this._smartGuides.map(sg => {
			sg.instance.snapElements = this._snapElems;
			sg.instance.elementBox = this._box;
			sg.instance.snapEventsX = this._snapEventsX;
			sg.instance.snapEventsY = this._snapEventsY;
			sg.instance.show = this._dragging;

			sg.instance.updateSubscriptions();
			sg.changeDetectorRef.detectChanges();

			sg.onDestroy(() => {
				sg.changeDetectorRef.detach();
			});
		});
	}

	/**
	 * Destroy SmartGuidesComponent.
	 */
	public _destroySmartGuides() {
		this._smartGuides.map(sg => {
			sg.destroy();
			this._smartGuides = Maybe.nothing<
				ComponentRef<SmartGuidesComponent>
			>();
		});
		this._smartGuidesContainer.map(elem => {
			if (elem.parentNode) {
				elem.parentNode.removeChild(elem);
			}
			this._smartGuidesContainer = Maybe.nothing<HTMLElement>();
		});
	}

	rotatedPosition() {
		let pLeft = this._elem.offsetLeft;
		let pTop = this._elem.offsetTop;

		let angle = this.getAngle();
		if (angle == 0)
			return {
				left: pLeft,
				right: pLeft + this._elem.offsetWidth,
				top: pTop,
				bottom: pTop + this._elem.offsetHeight
			};

		let oLeft = pLeft + this._elem.offsetWidth / 2;
		let oTop = pTop + this._elem.offsetHeight / 2;
		let x = pLeft - oLeft;
		let y = pTop - oTop;
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);

		let xRot0 = x * cos - y * sin + oLeft;
		let yRot0 = x * sin + y * cos + oTop;
		let xRot1 = -1 * x * cos - y * sin + oLeft;
		let yRot1 = -1 * x * sin + y * cos + oTop;
		let xRot2 = -1 * x * cos + y * sin + oLeft;
		let yRot2 = -1 * x * sin - y * cos + oTop;
		let xRot3 = x * cos + y * sin + oLeft;
		let yRot3 = x * sin - y * cos + oTop;

		return {
			left: lodash.min([xRot0, xRot1, xRot2, xRot3]),
			right: lodash.max([xRot0, xRot1, xRot2, xRot3]),
			top: lodash.min([yRot0, yRot1, yRot2, yRot3]),
			bottom: lodash.max([yRot0, yRot1, yRot2, yRot3])
		};
	}

	public getAngle() {
		try {
			let st = getComputedStyle(this._elem, null);
			let tr =
				st.getPropertyValue("-webkit-transform") ||
				st.getPropertyValue("-moz-transform") ||
				st.getPropertyValue("-ms-transform") ||
				st.getPropertyValue("-o-transform") ||
				st.getPropertyValue("transform") ||
				"FAIL";

			if (tr == "FAIL" || !tr) return 0;

			let values = tr
				.split("(")[1]
				.split(")")[0]
				.split(",");

			let a = parseFloat(values[0]); // 0.866025
			let b = parseFloat(values[1]); // 0.5
			let c = parseFloat(values[2]); // -0.5
			let d = parseFloat(values[3]); // 0.866025
			let scale = Math.sqrt(a * a + b * b);
			var sin = b / scale;
			// let angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
			let angle = Math.atan2(b, a);
			return angle;
		} catch (e) {
			return 0;
		}
	}

	/**
	 * Start dragging on mousedown.
	 */
	@HostListener("mousedown", ["$event"])
	onDragStart(event: MouseEvent) {
		if (!this.enabled || event.button !== 0) {
			return;
		}
		if (
			this._elem.offsetTop > 10 &&
			this.targetClass &&
			event.srcElement['className'].indexOf(this.targetClass) < 0
		)
			return;
		event.stopPropagation();
		event.preventDefault();

		this._dragSession.next(
			Maybe.just(
				this._dragSessionService.startDrag(event.pageX, event.pageY)
			)
		);
	}

	@HostListener("mouseover", ["$event"])
	onMouseOver(event: MouseEvent) {
		if (this._elem.offsetTop < 10 && this._initCursor != "move")
			this._initCursor = "move";
		else if (this._initCursor != this.cursor)
			this._initCursor = this.cursor;
	}

	/**
	 * Start dragging on mousedown.
	 */
	@HostListener("touchstart", ["$event"])
	onTouchStart(e: TouchEvent) {

		if (!this.enabled) {
			return;
		}
		if (
			this._elem.offsetTop > 10 &&
			this.targetClass &&
			e.srcElement['className'].indexOf(this.targetClass) < 0
		)
			return;

		this._dragSession.next(
			Maybe.just(
				this._dragSessionService.startDrag(e.changedTouches[0].pageX, e.changedTouches[0].pageY)
			)
		);
	}

	@HostListener("touchmove", ["$event"])
	onTouchMove(e: any) {
		if (this._elem.offsetTop < 10 && this._initCursor != "move")
			this._initCursor = "move";
		else if (this._initCursor != this.cursor)
			this._initCursor = this.cursor;
	}

	ngOnDestroy() {
		this._dragSession.value.map(ds => ds.stopDrag());
		this._subs.forEach(s => s.unsubscribe());
	}
}
