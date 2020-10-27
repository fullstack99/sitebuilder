import { Directive, Input, Output, OnDestroy, EventEmitter,
		 Renderer, HostBinding, ElementRef, ViewContainerRef, OnChanges,
		 SimpleChanges, ComponentRef, ComponentFactory, ComponentFactoryResolver,
		 Injector, OnInit
	   } from '@angular/core';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';

import { DragSessionService } from '@app-directives/drag-session/drag-session.service';
import { ResizeBoxComponent, ResizeEvent, ResizeDirection } from '@app-directives/resizable/resize-box.component';
import { Rect, Box } from '@app-lib/rect/rect';
import { SmartGuidesComponent, ElementBox, findSnapElements, SnapEvent as SnapEventOrig,
		 snapHorizontal, snapVertical
	   } from '@app-directives/smart-guides/smart-guides.component';
import { forwardObs } from '@app-lib/rx/rx';
import { elemOffsetLeft, elemOffsetTop } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';

export { ResizeDirection, ResizeEvent } from '@app-directives/resizable/resize-box.component';

interface SnapEvent extends SnapEventOrig {
	multiplier?: number;
}

@Directive({
	selector: '[resizable]',
	providers: [DragSessionService]
})
export class ResizableDirective implements OnChanges, OnDestroy, OnInit {
	/** Is resizing enabled? */
	@Input('resizable-enabled') enabled = false;
	@Input('resizable-showResizeBox') showResizeBox = false;

	/** Minimum width of the host element. */
	@Input('resizable-minWidth' ) minWidth : number = 0;
	/** Maximum width of the host element. */
	@Input('resizable-maxWidth' ) maxWidth : number = Infinity;
	/** Minimum height of the host element. */
	@Input('resizable-minHeight') minHeight: number = 0;
	/** Maximum width of the host element. */
	@Input('resizable-maxHeight') maxHeight: number = Infinity;

	/** Should contain the host element inside its parent? */
	@Input('resizable-keepInParent') keepInParent: boolean = false;

	/** Is snap enabled? */
	@Input('resizable-snapEnabled') snapEnabled: boolean = false;
	/** Distance between the host element and snap elements at which snap triggers. */
	@Input('resizable-snapTolerance') snapTolerance: number = 0;
	/** CSS selector specifying which elements to snap to. */
	@Input('resizable-snapSelector') snapSelector: string = '*';


	@Input('top') top = true;
	@Input('right') right = true;
	@Input('bottom') bottom = true;
	@Input('left') left = true;
	@Input('top-left') top_left = true;
	@Input('top-right') top_right = true;
	@Input('bottom-left') bottom_left = true;
	@Input('bottom-rigtht') bottom_right = true;
	@Input('disp-measure') disp_measure = true;

	/** Emits new element rect during resizing. */
	@Output('resizable-resize') resize = new EventEmitter<Box>();
	/** Emit when resizing ends. */
	@Output('resizable-resizeEnd') resizeEnd = new EventEmitter<Box>();

	@HostBinding('style.left'  ) styleLeft  : string;
	@HostBinding('style.top'   ) styleTop   : string;
	@HostBinding('style.width' ) styleWidth : string;
	@HostBinding('style.height') styleHeight: string;

	public _left  : Rx.Observable<number>;
	public _right : Rx.Observable<number>;
	public _top   : Rx.Observable<number>;
	public _bottom: Rx.Observable<number>;

	public _targetLeft  : Rx.Observable<number>;
	public _targetRight : Rx.Observable<number>;
	public _targetTop   : Rx.Observable<number>;
	public _targetBottom: Rx.Observable<number>;

	public _leftRange  : Rx.Observable<[number, number]>;
	public _rightRange : Rx.Observable<[number, number]>;
	public _topRange   : Rx.Observable<[number, number]>;
	public _bottomRange: Rx.Observable<[number, number]>;

	public _box: Rx.Observable<Box>;
	public _rect: Rx.Observable<Rect>;

	public _resizeBox		  = Maybe.nothing<ComponentRef<ResizeBoxComponent>>();
	public _resizeBoxContainer = Maybe.nothing<HTMLElement>();

	public _smartGuides		  = Maybe.nothing<ComponentRef<SmartGuidesComponent>>();
	public _smartGuidesContainer = Maybe.nothing<HTMLElement>();

	/** Elements to snap to. */
	public _snapElems: Rx.Observable<ElementBox[]>;

	/** Host element. */
	public _elem: HTMLElement;
	/** Parent element. */
	public _parent: HTMLElement;

	public _resizeStart = new Rx.Subject<void>();
	public _resize	  = new Rx.Subject<ResizeEvent>();
	public _resizeEnd   = new Rx.Subject<void>();
	public _resizing	: Rx.Observable<boolean>;

	public _snapEventsX: Rx.Observable<SnapEvent[]>;
	public _snapEventsY: Rx.Observable<SnapEvent[]>;

	public _resizeBoxSubs: Rx.Subscription[] = [];
	public _subs: Rx.Subscription[] = [];

	public _initialized = false;

	constructor (
		public _renderer: Renderer,
		public _dragSessionService: DragSessionService,
		public _elementRef: ElementRef,
		public _viewContainerRef: ViewContainerRef,
		public _resolver: ComponentFactoryResolver,
		public _injector: Injector
	) {}

	ngOnInit() {
		this._elem = this._elementRef.nativeElement;
		this._parent = this._elem.parentElement as HTMLElement;

		this._resizing = this._resizeStart.map(() => true)
			.merge(this._resizeEnd.map(() => false));

		/**
		 * For each resize session with allowed direction
		 * start from the given value and accumulate
		 * mouse movements along specified axis.
		 */
		const targetSideObs = (
			startingValue: () => number,
			axis: 'x' | 'y',
			allowedDirections: ResizeDirection[]
		) => this._resizeStart
			.map(() =>
				this._resize
					.filter(resize => allowedDirections.indexOf(resize.direction) >= 0)
					.scan((acc, resize) =>
						acc + (axis === 'x' ? resize.deltaPrevX : resize.deltaPrevY),
						startingValue()
					)
					.startWith(startingValue())
			)
			.switch()
			.publish().refCount(); // {}

		this._targetLeft = targetSideObs(
			() => elemOffsetLeft(this._elem),
			'x',
			['top left', 'left', 'bottom left']
		);

		this._targetRight = targetSideObs(
			() => elemOffsetLeft(this._elem) + this._elem.offsetWidth,
			'x',
			['top right', 'right', 'bottom right']
		);

		this._targetTop = targetSideObs(
			() => elemOffsetTop(this._elem),
			'y',
			['top left', 'top', 'top right']
		);

		this._targetBottom = targetSideObs(
			() => elemOffsetTop(this._elem) + this._elem.offsetHeight,
			'y',
			['bottom left', 'bottom', 'bottom right']
		);

		this._snapElems = this._resizeStart.map(() =>
			this.snapEnabled
				? findSnapElements(this._elem, this.snapSelector)
				: []
		).publish().refCount();

		const restrictRange = (
			side: Rx.Observable<number>,
			range: Rx.Observable<[number, number]>
		) => side
			.withLatestFrom(range)
			.map(([sideVal, [min, max]]) => lodash.clamp(sideVal, min, max))
			.publish().refCount();

		const restrictParent = (
			sideObs: Rx.Observable<number>,
			side: 'left' | 'right' | 'top' | 'bottom'
		) => sideObs
			.map(sideVal => {
				return this.keepInParent
					? lodash.clamp(sideVal, 0, (side === 'left' || side === 'right')
						? this._parent.offsetWidth
						: this._parent.offsetHeight)
					: sideVal;
			})
			.publish().refCount();

		/** Check if in range of any snaps. */
		const snapOpportunities = (
			sideObs: Rx.Observable<number>,
			side: 'left' | 'right' | 'top' | 'bottom'
		) => sideObs
			.withLatestFrom(this._snapElems)
			.withLatestFrom(forwardObs(() => this._box))
			.map(([[sideVal, snapElems], box]) => {
				const length = {
					'left'  : box.right  - sideVal,
					'right' : sideVal	- box.left,
					'top'   : box.bottom - sideVal,
					'bottom': sideVal	- box.top
				}[side];

				const snapFn = (side === 'left' || side === 'right')
					? snapHorizontal
					: snapVertical;
				const center = (side === 'left' || side === 'top')
					? sideVal + length / 2
					: sideVal - length / 2;

				return [
					...snapFn(sideVal, snapElems, this.snapTolerance),
					...snapFn(center , snapElems, this.snapTolerance / 2)
						.map(e => Object.assign({}, e, { multiplier: 2 }))
				];
			})
			.publish().refCount();

		/** Choose closest snaps. */
		const snapEvents = (
			sideObs: Rx.Observable<number>,
			snapOpportunitiesObs: Rx.Observable<SnapEvent[]>,
			side: 'left' | 'right' | 'top' | 'bottom'
		) => sideObs
			.withLatestFrom(snapOpportunitiesObs)
			.withLatestFrom(this._resize)
			.map(([[_side, events], resize]) => {
				if (events.length === 0) { return []; }

				const deltaPrev = (side === 'left' || side === 'right')
					? resize.deltaPrevX : resize.deltaPrevY;

				const snapGroups = lodash.mapValues(
					lodash.groupBy(events, e => e.distance),
					(evs, distance) => evs.sort((e0, e1) => deltaPrev)
				);

				const minDistance = Object.keys(snapGroups)
					.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))[0];

				return snapGroups[minDistance];
			})
			.publish().refCount();

		/** Move side to the snap. */
		const snapSide = (
			sideObs: Rx.Observable<number>,
			snapEventsObs: Rx.Observable<SnapEvent[]>
		) => sideObs
			.withLatestFrom(snapEventsObs)
			.map(([side, snapEvent]) =>
				side + (snapEvent.length > 0
					? snapEvent[0].distance * (snapEvent[0].multiplier || 1)
					: 0)
			)
			.publish().refCount();

		const left   = restrictParent(restrictRange(this._targetLeft  , forwardObs(() => this._leftRange  )), 'left'  );
		const right  = restrictParent(restrictRange(this._targetRight , forwardObs(() => this._rightRange )), 'right' );
		const top	= restrictParent(restrictRange(this._targetTop   , forwardObs(() => this._topRange   )), 'top'   );
		const bottom = restrictParent(restrictRange(this._targetBottom, forwardObs(() => this._bottomRange)), 'bottom');

		const snapEventsLeft   = snapEvents(left  , snapOpportunities(left  , 'left'  ), 'left'  );
		const snapEventsRight  = snapEvents(right , snapOpportunities(right , 'right' ), 'right' );
		const snapEventsTop	= snapEvents(top   , snapOpportunities(top   , 'top'   ), 'top'   );
		const snapEventsBottom = snapEvents(bottom, snapOpportunities(bottom, 'bottom'), 'bottom');

		this._snapEventsX = snapEventsLeft.merge(snapEventsRight);
		this._snapEventsY = snapEventsTop .merge(snapEventsBottom);

		this._left = this._resizeStart
			.map(() => elemOffsetLeft(this._elem))
			.merge(snapSide(left  , snapEventsLeft  ));

		this._right = this._resizeStart
			.map(() => {
				console.log(elemOffsetLeft(this._elem), this._elem.offsetWidth, elemOffsetLeft(this._elem) + this._elem.offsetWidth)
				return elemOffsetLeft(this._elem) + this._elem.offsetWidth;
			})
			.merge(snapSide(right , snapEventsRight ));

		this._top = this._resizeStart
			.map(() => elemOffsetTop(this._elem))
			.merge(snapSide(top   , snapEventsTop   ));

		this._bottom = this._resizeStart
			.map(() => elemOffsetTop(this._elem) + this._elem.offsetHeight)
			.merge(snapSide(bottom, snapEventsBottom));

		this._leftRange = this._right
			.map<any, [number, number]>(r => [r - this.maxWidth , r - this.minWidth ])
			.publish().refCount();

		this._rightRange = this._left
			.map<any, [number, number]>(l => {
				return [l + this.minWidth , l + this.maxWidth];
			})
			.publish().refCount();

		this._topRange = this._bottom
			.map<any, [number, number]>(b => [b - this.maxHeight, b - this.minHeight])
			.publish().refCount();

		this._bottomRange = this._top
			.map<any, [number, number]>(t => [t + this.minHeight, t + this.maxHeight])
			.publish().refCount();

		this._box = this._left
			.combineLatest(this._right)
			.combineLatest(this._top)
			.combineLatest(this._bottom)
			.map(([[[l, r], t], b]) => new Box(l, r, t, b))
			.publish().refCount();

		this._rect = this._box
			.map(b => b.toRect())
			.publish().refCount();

		this._subs.push(
			  this._rect.subscribe(({ left, top, width, height }) => { // tslint:disable-line:no-shadowed-variable
				if (height >= this.minHeight) {
					this.styleLeft   = left + 'px';
					this.styleTop	= top + 'px';
					this.styleWidth  = width + 'px';
					this.styleHeight = height + 'px';
				}
			}),
			// Subscribe to `_resize` not to `_box` directly because `_box` may fire
			// before `_resize`.
			this._resize.withLatestFrom(this._box)
				.subscribe(([_e, b]) => {
					if (b.height() >= this.minHeight)
						this.resize.emit(b);
				}),

			this._resizeEnd.withLatestFrom(this._box)
				.subscribe(([_e, b]) => this.resizeEnd.emit(b))
		);

		this._initialized = true;
		if (this.enabled) { this._createSmartGuides(); }
	}

	ngOnChanges(changes: SimpleChanges) {
		const enabled = changes['enabled'];
		if (enabled && this._resizeBox) {
			this._resizeBox.map(rb => {
				rb.instance.enabled = enabled.currentValue;
				rb.changeDetectorRef.detectChanges();
			});
		}

		if (enabled && enabled.currentValue && this._initialized) {
			this._createSmartGuides();
		} else if (enabled && !enabled.currentValue) {
			this._destroySmartGuides();
		}

		const showResizeBox = changes['showResizeBox'];
		if (showResizeBox && showResizeBox.currentValue) {
			this._createResizeBox();
		} else if (showResizeBox && !showResizeBox.currentValue) {
			this._destroyResizeBox();
		}
	}

	/**
	 * Dynamically load ResizeBoxComponent.
	 */
	public _createResizeBox() {
		const factory = this._resolver.resolveComponentFactory(ResizeBoxComponent);
		this._resizeBoxContainer = Maybe.just(this._renderer.createElement(this._elementRef.nativeElement, 'div'));
		this._resizeBox = this._resizeBoxContainer.map(elem =>
			factory.create(this._injector, [], elem));
		this._resizeBox.map(rb => {
			rb.instance.enabled = this.enabled;
			rb.instance.top = this.top;
			rb.instance.top_left = this.top_left;
			rb.instance.top_right = this.top_right;
			rb.instance.left = this.left;
			rb.instance.right = this.right;
			rb.instance.bottom = this.bottom;
			rb.instance.bottom_left = this.bottom_left;
			rb.instance.bottom_right = this.bottom_right;
			rb.instance.disp_measure = this.disp_measure;
			rb.instance.containerEle = this._parent;

			rb.changeDetectorRef.detectChanges();

			rb.onDestroy(() => {
				rb.changeDetectorRef.detach();
			});

			this._resizeBoxSubs.push(
				rb.instance.resizeStart.asObservable().subscribe(this._resizeStart),
				rb.instance.resize	 .asObservable().subscribe(this._resize),
				rb.instance.resizeEnd  .asObservable().subscribe(this._resizeEnd  )
			);
		});
	}

	/**
	 * Destroy ResizeBoxComponent.
	 */
	public _destroyResizeBox() {
		this._resizeBox.map(rb => {
			rb.destroy();
			this._resizeBox = Maybe.nothing<ComponentRef<ResizeBoxComponent>>();
		});
		this._resizeBoxContainer.map(elem => {
			if (elem.parentNode) {
				elem.parentNode.removeChild(elem);
			}
			this._resizeBoxContainer = Maybe.nothing<HTMLElement>();
		});

		this._resizeBoxSubs.forEach(x => x.unsubscribe());
		this._resizeBoxSubs = [];
	}

	/**
	 * Dynamically load SmartGuidesComponent.
	 */
	public _createSmartGuides() {
		const factory = this._resolver.resolveComponentFactory(SmartGuidesComponent);
		this._smartGuidesContainer = Maybe.just(this._renderer.createElement(this._elem, 'div'));
		this._smartGuides = this._smartGuidesContainer.map(elem => {
			return factory.create(this._injector, [], elem);
		});
		this._smartGuides.map(sg => {
			sg.instance.snapElements = this._snapElems;
			sg.instance.elementBox   = this._box;
			sg.instance.snapEventsX  = this._snapEventsX;
			sg.instance.snapEventsY  = this._snapEventsY;
			sg.instance.show		 = this._resizing;

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
			this._smartGuides = Maybe.nothing<ComponentRef<SmartGuidesComponent>>();
		});
		this._smartGuidesContainer.map(elem => {
			if (elem.parentNode) {
				elem.parentNode.removeChild(elem);
				this._smartGuidesContainer = Maybe.nothing<HTMLElement>();
			}
		});
	}

	ngOnDestroy() {
		this._destroyResizeBox();
		this._subs.forEach(s => s.unsubscribe);
	}
}
