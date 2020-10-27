import { Component, Input, OnDestroy, ChangeDetectorRef
       } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { Box, Rect } from '@app-lib/rect/rect';
import { elemOffsetLeft, elemOffsetTop } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';

export interface ElementBox {
    element: HTMLElement;
    box: Box;
}

/**
 * Dynamically created by `DraggableDirective` and `ResizableDirective`.
 * Not supposed to be used in templates.
 */
@Component({
    moduleId   : module.id,
    templateUrl: 'smart-guides.component.html',
    styleUrls  : ['smart-guides.component.css']
})
export class SmartGuidesComponent implements OnDestroy {
    @Input() snapElements: Rx.Observable<ElementBox[]>;
    @Input() elementBox: Rx.Observable<Box>;

    @Input() snapEventsX: Rx.Observable<SnapEvent[]>;
    @Input() snapEventsY: Rx.Observable<SnapEvent[]>;

    @Input() show: Rx.Observable<boolean>;

    box = Maybe.nothing<Box>();
    smartguides: Rect[];
    showCoords = false;

    public _subs: Rx.Subscription[];

    constructor(public _changeDetector: ChangeDetectorRef) {
    }

    updateSubscriptions() {
        if (this._subs) {
            this._subs.forEach(x => x.unsubscribe());
        }

        this._subs = [
            this.elementBox
                .combineLatest(this.snapElements)
                .combineLatest(this.snapEventsX.startWith([]))
                .combineLatest(this.snapEventsY.startWith([]))
                .combineLatest(this.show)
                .subscribe(([[[[elementBox, snapElements], snapEventsX], snapEventsY], show]) => {
                    this.smartguides = show
                        ? [ ...this._verticalGuides  (elementBox, snapElements, snapEventsX),
                            ...this._horizontalGuides(elementBox, snapElements, snapEventsY) ]
                        : [];
                    this._changeDetector.detectChanges();
                }),
            this.elementBox.combineLatest(this.show)
                .subscribe(([box, show]) => {
                    this.box = Maybe.fromBool(show, box);
                    this._changeDetector.detectChanges();
                })
        ];
    }

    ngOnDestroy() {
        if (this._subs) {
            this._subs.forEach(x => x.unsubscribe());
        }
    }

    public _verticalGuides(
        elementBox: Box,
        snapElements: ElementBox[],
        snapEvents: SnapEvent[]
    ): Rect[] {
        if (snapElements.length === 0 || snapEvents.length === 0) {
            return [];
        }

        // Snap group is multiple aligned elements.
        const snapGroups = lodash.groupBy(snapEvents, e => e.targetSide);

        return <Rect[]>lodash.map(snapGroups, (snaps, targetSide) => {
            let topsAndBots = snaps.reduce(
                (acc, curr) => [...acc, curr.targetElement.box.top, curr.targetElement.box.bottom],
                <number[]>[]
            );
            // Add element itself.
            topsAndBots.push(
                elementBox.top,
                elementBox.bottom
            );
            topsAndBots = topsAndBots.sort((a, b) => a - b);

            if (topsAndBots.length === 2) {
                return undefined;
            } else {
                return new Rect(
                    parseInt(targetSide!, 10) - elementBox.left,
                    topsAndBots[0] - elementBox.top,
                    0,
                    topsAndBots[topsAndBots.length - 1] - topsAndBots[0]
                );
            }
        })
        .filter(r => r !== undefined);
    }

    public _horizontalGuides(
        elementBox: Box,
        snapElements: ElementBox[],
        snapEvents: SnapEvent[]
    ): Rect[] {
        if (snapElements.length === 0 || snapEvents.length === 0) {
            return [];
        }

        // Snap group is multiple aligned elements.
        const snapGroups = lodash.groupBy(snapEvents, e => e.targetSide);

        return <Rect[]>lodash.map(snapGroups, (snaps, targetSide) => {
            let leftsAndRights = snaps.reduce(
                (acc, curr) => [...acc, curr.targetElement.box.left, curr.targetElement.box.right],
                <number[]>[]
            );
            // Add element itself.
            leftsAndRights.push(
                elementBox.left,
                elementBox.right
            );
            leftsAndRights = leftsAndRights.sort((a, b) => a - b);

            if (leftsAndRights.length === 2) {
                return undefined;
            } else {
                return new Rect(
                    leftsAndRights[0] - elementBox.left,
                    parseInt(targetSide!, 10) - elementBox.top,
                    leftsAndRights[leftsAndRights.length - 1] - leftsAndRights[0],
                    0
                );
            }
        })
        .filter(r => r !== undefined);
    }
}

/**
 * Find siblings of the `element` satisfying `snapSelector`.
 * Returns empty list if no selector given.
 */
export function findSnapElements(
    element: HTMLElement,
    snapSelector: string
): ElementBox[] {
    if (snapSelector) {
        return (<HTMLElement[]>Array.prototype.slice.call(
            element.parentElement!.querySelectorAll(snapSelector)
        ))
        // Direct children only.
        .filter(e => e.parentElement === element.parentElement && e !== element)
        // Visible only.
        .filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        })
        .map(e => ({
            element: e,
            box: new Box(
                elemOffsetLeft(e),
                elemOffsetLeft(e) + e.offsetWidth,
                elemOffsetTop(e),
                elemOffsetTop(e) + e.offsetHeight
            )
        }));
    } else {
        return [];
    }
}

/**
 * 
 */
export function snapHorizontal(
    side: number,
    snapElements: ElementBox[],
    snapTolerance: number
): SnapEvent[] {
    return snap(side, snapElements, snapTolerance, (box) => [box.right, box.left, box.horizontalCenter()]);
}

/**
 * 
 */
export function snapVertical(
    side: number,
    snapElements: ElementBox[],
    snapTolerance: number
): SnapEvent[] {
    return snap(side, snapElements, snapTolerance, (box) => [box.bottom, box.top, box.verticalCenter()]);
}

export interface SnapEvent {
    targetElement: ElementBox;
    targetSide   : number;
    sourceSide   : number;
    distance     : number;
}

/**
 * 
 */
export function snap(
    sideCoord: number,
    snapElements: ElementBox[],
    snapTolerance: number,
    snapSidesSelector: (box: Box) => number[]
): SnapEvent[] {
    const snapEvents = snapElements.reduce<SnapEvent[]>(
        (acc, curr) => [
            ...acc,
            ...snapSidesSelector(curr.box)
                .map(targetSide => ({
                    targetElement: curr,
                    targetSide   : targetSide,
                    sourceSide   : sideCoord,
                    distance     : targetSide - sideCoord
                }))
        ],
        []
    ).filter((e) => Math.abs(e.distance) <= snapTolerance);

    return snapEvents.sort((e0, e1) => Math.abs(e0.distance - e1.distance));
}
