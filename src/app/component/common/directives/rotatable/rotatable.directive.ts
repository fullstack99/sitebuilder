import {
    Directive, Input, Output, OnDestroy, EventEmitter,
    Renderer, HostBinding, ElementRef, ViewContainerRef, OnChanges,
    SimpleChanges, ComponentRef, ComponentFactory, ComponentFactoryResolver,
    Injector, OnInit
} from '@angular/core';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';

import { DragSessionService, DragEvent } from '@app-directives/drag-session/drag-session.service';
import {
    SmartGuidesComponent, ElementBox, findSnapElements, SnapEvent as SnapEventOrig,
    snapHorizontal, snapVertical
} from '@app-directives/smart-guides/smart-guides.component';
import { forwardObs } from '@app-lib/rx/rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { elemOffsetLeft, elemOffsetTop } from '@app-lib/dom/dom';
import { RotateBoxComponent } from '@app-directives/rotatable/rotate-box.component';


interface SnapEvent extends SnapEventOrig {
    multiplier?: number;
}

@Directive({
    selector: '[rotatable]',
    providers: [DragSessionService]
})
export class RotatableDirective implements OnChanges, OnDestroy, OnInit {
    /** Is resizing enabled? */    
    @Input('rotatable-enabled') enabled = false;
    @Input('rotatable-showRotateBox') showRotateBox = false;
    @Input('rotatable-degree') degree: number = 0;
    
    /** Emits new element during rotating. */
    @Output('rotatable-rotate') rotate = new EventEmitter<number>();
    /** Emit when rotating ends. */
    @Output('rotatable-rotateEnd') rotateEnd = new EventEmitter<number>();

    @HostBinding('style.transform') transform: string;    

    public _degree: Rx.Observable<number>;

    /** Host element. */
    public _elem: HTMLElement;
    /** Parent element. */
    public _parent: HTMLElement;

    public _rotateStart = new Rx.Subject<void>();
    public _rotate = new Rx.Subject<DragEvent>();
    public _rotateEnd = new Rx.Subject<void>();

    public _rotating: Rx.Observable<boolean>;
    public _rotateBox = Maybe.nothing<ComponentRef<RotateBoxComponent>>();
    public _rotateBoxContainer = Maybe.nothing<HTMLElement>();

    public _rotateSubs: Rx.Subscription[] = [];
    public _subs: Rx.Subscription[] = [];    
    public _initialized = false;

    public center_x: number;
    public center_y: number;

    constructor(
        public _renderer: Renderer,
        public _dragSessionService: DragSessionService,
        public _elementRef: ElementRef,
        public _viewContainerRef: ViewContainerRef,
        public _resolver: ComponentFactoryResolver,
        public _injector: Injector
    ) { }

    ngOnInit() {
        this._elem = this._elementRef.nativeElement;
        this._parent = this._elem.parentElement as HTMLElement;        
        this._rotating = this._rotateStart.map(() => true)
            .merge(this._rotateEnd.map(() => false));

        this.transform = 'rotate(' + this.degree + 'deg)';
        this._degree = this._rotateStart.map(() =>0);

        this._subs.push(
            this._degree.subscribe(degree => {
                this.transform = 'rotate(' + this.degree + 'deg)';
            }),
            this._rotateStart.subscribe(() => {                
                this.center_x = Number(this._elem.style.left.split('px')[0]) + this._elem.parentElement.getBoundingClientRect().left + (this._elem.offsetWidth / 2);
                this.center_y = Number(this._elem.style.top.split('px')[0]) +  this._elem.parentElement.getBoundingClientRect().top + (this._elem.offsetHeight / 2);                
            }),
            this._rotate.subscribe(dragEvent => {               
                               
                let mouse_x = dragEvent.pageX;
                let mouse_y = dragEvent.pageY;                

                let radians = Math.atan2(mouse_y - this.center_y, mouse_x - this.center_x);                
                this.degree = (radians * (180 / Math.PI) + 90);
                
                this.transform = 'rotate(' + this.degree + 'deg)';
                this.rotate.emit(this.degree);
                this._rotateBox.map(rb => {
                    rb.instance.degree = this.degree;
                    rb.changeDetectorRef.detectChanges();                    
                });
            }),

            this._rotateEnd.subscribe(() => {
                this.rotateEnd.emit(this.degree);
            })
        );

        this._initialized = true;       
    }

    ngOnChanges(changes: SimpleChanges) {
        const enabled = changes['enabled'];
        if (enabled && this._rotateBox) {
            this._rotateBox.map(rb => {
                rb.instance.enabled = enabled.currentValue;
                rb.changeDetectorRef.detectChanges();
            });
        }

        const showRotateBox = changes['showRotateBox'];
        if (showRotateBox && showRotateBox.currentValue) {
            this._createRotateBox();
        } else if (showRotateBox && !showRotateBox.currentValue) {
            this._destroyRotateBox();
        }
    }

    public _createRotateBox() {
        const factory = this._resolver.resolveComponentFactory(RotateBoxComponent);
        this._rotateBoxContainer = Maybe.just(this._renderer.createElement(this._elementRef.nativeElement, 'div'));
        this._rotateBox = this._rotateBoxContainer.map(elem =>
            factory.create(this._injector, [], elem));

        this._rotateBox.map(rb => {
            rb.instance.enabled = this.enabled;
            rb.instance.degree = this.degree;
            rb.changeDetectorRef.detectChanges();
            rb.onDestroy(() => {
                rb.changeDetectorRef.detach();
            });

            this._rotateSubs.push(
                rb.instance.rotateStart.asObservable().subscribe(this._rotateStart),
                rb.instance.rotate.asObservable().subscribe(this._rotate),
                rb.instance.rotateEnd.asObservable().subscribe(this._rotateEnd)
            );
        });
    }

    public _destroyRotateBox() {
        this._rotateBox.map(rb => {
            rb.destroy();
            this._rotateBox = Maybe.nothing<ComponentRef<RotateBoxComponent>>();
        });
        this._rotateBoxContainer.map(elem => {
            if (elem.parentNode) {
                elem.parentNode.removeChild(elem);
            }
            this._rotateBoxContainer = Maybe.nothing<HTMLElement>();
        });

        this._rotateSubs.forEach(x => x.unsubscribe());
        this._rotateSubs = [];
    }

    ngOnDestroy() {     
        this._subs.forEach(s => s.unsubscribe);
    }
}
