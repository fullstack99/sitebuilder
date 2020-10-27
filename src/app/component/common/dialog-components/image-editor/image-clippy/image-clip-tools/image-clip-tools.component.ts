import { ViewChild, Component, ElementRef, ChangeDetectorRef, SimpleChanges,
         OnInit, OnChanges, AfterViewInit, OnDestroy, Input, Output, EventEmitter
       } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { ImagePath, ClipPath } from '@app/models';

export interface ImageClipTool {
    name: string;
    clipPath: ClipPath;
}

export const IMAGECLIPTOOLS: ImageClipTool[] = [
        { name: 'Circle', clipPath: {name: 'circle', type: 'circle', value: [{x:50, y:0}, {x:50, y:50}], outside: 0} },
        { name: 'Ellipse', clipPath: {name: 'ellipse', type: 'ellipse', value: [{x:25, y:50}, {x:50, y:10}, {x:50, y:50}], outside: 0} },
        { name: 'Tear', clipPath: {name: 'tear', type: 'svg', value: [{x:140, y:0}, {x:140, y:100}, {x:280, y:100}, {x:210, y:227}, {x:170, y:280}, {x:110, y:280}, {x:70, y:227}, {x:0, y:100}], outside: 0} },
        { name: 'Triangle', clipPath: {name: 'trianlge', type: 'polygon', value: [{x:50, y:0}, {x:0, y:100}, {x:100, y:100}], outside: 0} },
        { name: 'Trapezoid', clipPath: {name: 'trapezoid', type: 'polygon', value: [{x:20, y:0}, {x:80, y:0}, {x:100, y:100}, {x:0, y:100}], outside: 0} },
        { name: 'Parallelogram', clipPath: {name: 'parallelogram', type: 'polygon', value: [{x:25, y:0}, {x:100, y:0}, {x:75, y:100}, {x:0, y:100}], outside: 0} },
        { name: 'Rhombus', clipPath: {name: 'rhombus', type: 'polygon', value: [{x:50, y:0}, {x:100, y:50}, {x:50, y:100}, {x:0, y:50}], outside: 0} },
        { name: 'Pentagon', clipPath: {name: 'pentagon', type: 'polygon', value: [{x:50, y:0}, {x:100, y:38}, {x:82, y:100}, {x:18, y:100}, {x:0, y:38}], outside: 0} },
        { name: 'Hexagon', clipPath: {name: 'hexagon', type: 'polygon', value: [{x:50, y:0}, {x:100, y:25}, {x:100, y:75}, {x:50, y:100}, {x:0, y:75}, {x:0, y:25}], outside: 0} },
        { name: 'Heptagon', clipPath: {name: 'heptagon', type: 'polygon', value: [{x:50, y:0}, {x:90, y:20}, {x:100, y:60}, {x:75, y:100}, {x:25, y:100}, {x:0, y:60}, {x:10, y:20}], outside: 0} },
        { name: 'Octagon', clipPath: {name: 'octagon', type: 'polygon', value: [{x:30, y:0}, {x:70, y:0}, {x:100, y:30}, {x:100, y:70}, {x:70, y:100}, {x:30, y:100}, {x:0, y:70}, {x:0, y:30}], outside: 0} },
        { name: 'Nonagon', clipPath: {name: 'nonagon', type: 'polygon', value: [{x:50, y:0}, {x:83, y:12}, {x:100, y:43}, {x:94, y:78}, {x:68, y:100}, {x:32, y:100}, {x:6, y:78}, {x:0, y:43}, {x:17, y:12}], outside: 0} },
        { name: 'Decagon', clipPath: {name: 'decagon', type: 'polygon', value: [{x:50, y:0}, {x:80, y:10}, {x:100, y:35}, {x:100, y:70}, {x:80, y:90}, {x:50, y:100}, {x:20, y:90}, {x:0, y:70}, {x:0, y:35}, {x:20, y:10}], outside: 0} },
        { name: 'Bevel', clipPath: {name: 'bevel', type: 'polygon', value: [{x:20, y:0}, {x:80, y:0}, {x:100, y:20}, {x:100, y:80}, {x:80, y:100}, {x:20, y:100}, {x:0, y:80}, {x:0, y:20}], outside: 0} },
        { name: 'Rabbet', clipPath: {name: 'rabbet', type: 'polygon', value: [{x:0, y:15}, {x:15, y:15}, {x:15, y:0}, {x:85, y:0}, {x:85, y:15}, {x:100, y:15}, {x:100, y:85}, {x:85, y:85}, {x:85, y:100}, {x:15, y:100}, {x:15, y:85}, {x:0, y:85}], outside: 0} },
        { name: 'Left Arrow', clipPath: {name: 'left arrow', type: 'polygon', value: [{x:40, y:0}, {x:40, y:20}, {x:100, y:20}, {x:100, y:80}, {x:40, y:80}, {x:40, y:100}, {x:0, y:50}], outside: 0} },
        { name: 'Right Arrow', clipPath: {name: 'right arrow', type: 'polygon', value: [{x:0, y:20}, {x:60, y:20}, {x:60, y:0}, {x:100, y:50}, {x:60, y:100}, {x:60, y:80}, {x:0, y:80}], outside: 0} },
        { name: 'Left Point', clipPath: {name: 'left point', type: 'polygon', value: [{x:25, y:0}, {x:100, y:1}, {x:100, y:100}, {x:25, y:100}, {x:0, y:50}], outside: 0} },
        { name: 'Right Point', clipPath: {name: 'right point', type: 'polygon', value: [{x:0, y:0}, {x:75, y:0}, {x:100, y:50}, {x:75, y:100}, {x:0, y:100}], outside: 0} },
        { name: 'Left Chevron', clipPath: {name: 'left chevron', type: 'polygon', value: [{x:100, y:0}, {x:75, y:50}, {x:100, y:100}, {x:25, y:100}, {x:0, y:50}, {x:25, y:0}], outside: 0} },
        { name: 'Right Chevron', clipPath: {name: 'right chevron', type: 'polygon', value: [{x:75, y:0}, {x:100, y:50}, {x:75, y:100}, {x:0, y:100}, {x:25, y:50}, {x:0, y:0}], outside: 0} },
        { name: 'Star', clipPath: {name: 'star', type: 'polygon', value: [{x:50, y:0}, {x:61, y:35}, {x:98, y:35}, {x:68, y:57}, {x:79, y:91}, {x:50, y:70}, {x:21, y:91}, {x:32, y:57}, {x:2, y:35}, {x:39, y:35}], outside: 0} },
        { name: 'Cross', clipPath: {name: 'cross', type: 'polygon', value: [{x:10, y:25}, {x:35, y:25}, {x:35, y:0}, {x:65, y:0}, {x:65, y:25}, {x:90, y:25}, {x:90, y:50}, {x:65, y:50}, {x:65, y:100}, {x:35, y:100}, {x:35, y:50}, {x:10, y:50}], outside: 0} },
        { name: 'Message', clipPath: {name: 'message', type: 'polygon', value: [{x:0, y:0}, {x:100, y:0}, {x:100, y:75}, {x:75, y:75}, {x:75, y:100}, {x:50, y:75}, {x:0, y:75}], outside: 0} },
        { name: 'Close', clipPath: {name: 'close', type: 'polygon', value: [{x:20, y:0}, {x:0, y:20}, {x:30, y:50}, {x:0, y:80}, {x:20, y:100}, {x:50, y:70}, {x:80, y:100}, {x:100, y:80}, {x:70, y:50}, {x:100, y:20}, {x:80, y:0}, {x:50, y:30}], outside: 0} },
        { name: 'Frame', clipPath: {name: 'frame', type: 'polygon', value: [{x:0, y:0}, {x:0, y:100}, {x:25, y:100}, {x:25, y:25}, {x:75, y:25}, {x:75, y:75}, {x:25, y:75}, {x:25, y:100}, {x:100, y:100}, {x:100, y:0}], outside: 0} },
        { name: 'Inset', clipPath: {name: 'inset', type: 'inset', value: [{x:50, y:5}, {x:95, y:50}, {x:50, y:95}, {x:5, y:50}], outside: 0} }
    ];
// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
    moduleId   : module.id,
    selector   : 'image-clip-tools',
    templateUrl: './image-clip-tools.component.html',
    styleUrls: [
        '../../../../../../../assets/styles/canvas-nav.css',
        './image-clip-tools.component.css'
        ]
})
export class ImageClipToolsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

    @Input() clipPath: ClipPath = null;
    @Output() command = new EventEmitter<string>();
    @Output() setClipPath = new EventEmitter<ClipPath>();
    @Output() setOutsideClip = new EventEmitter<number>();

    @ViewChild('usefulSwiper') public usefulSwiper: any;

    _activeIndex: number = 0;
    isBeginning: boolean = true;
    isEnd: boolean = false;
    swiperConfig: Object;

    _tools = IMAGECLIPTOOLS;
    _outsideClip = new FormControl(0);
    private _subs: Rx.Subscription[] = [];

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.swiperConfig = {
            direction: 'horizontal',
            observer: true,
            initialSlide: -1,
            slidesPerView: 'auto',
            spaceBetween: 10,

            onSlideChangeEnd: (slider: any) => {
                this.isBeginning = slider.isBeginning;
                this.isEnd = slider.isEnd;
                this._activeIndex = slider.activeIndex;
            }
        };

        this._subs=[
            this._outsideClip.valueChanges.subscribe(result => {
                this.setOutsideClip.emit(result);
            })
        ];
        this.onSetClipPath(IMAGECLIPTOOLS[0].clipPath);
    }

    ngAfterViewInit() {
        const interval = setInterval(() => {
            if (this.usefulSwiper && this.usefulSwiper.nativeElement.swiper) {
                this.usefulSwiper.nativeElement.swiper.slideTo(0);
                clearInterval(interval);
            }
        },300);
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    onClickTool(tool: string) {
        this.command.emit(tool);
    }

    onSetClipPath(clipPath: ClipPath) {
        let outClipPath = lodash.cloneDeep(clipPath);
        outClipPath.outside = this._outsideClip.value;
        this.setClipPath.emit(outClipPath);
    }

    canActiveTool(tool: string): boolean {
        switch (tool) {
            case 'PlaceOnPage':
                return this.clipPath ? true : false;
            default:
                if (this.clipPath && this.clipPath.name==tool)
                    return true;
                else
                    return false;
        }
    }

    getSVGPath(clipPath: ClipPath) {
        let p =[1,2,3,4,5,6,7,1,0];
        let result = 'M ' + clipPath.value[0].x/15 + ' ' +  clipPath.value[0].y/15 + ' ';
        for(let i = 0; i < 3; i++) {
            result += 'C ';
            for(let j = 0; j < 3; j++) {
                result += clipPath.value[p[i*3 + j]].x/15 + ' ' + clipPath.value[p[i*3 + j]].y/15 + ' ';
            }
        }
        result +='Z ';
        return result;
    }

    getPolygon(clipPath: ClipPath): string{
        let result: string = '';
        clipPath.value.forEach((v, i) => {
            if (i>0)
                result += ',';
            result += v.x + '% ' + v.y + '%';
        })
        if (result != '')
            result = 'polygon(' + result + ')';
        return result;
    }

    getCircle(clipPath: ClipPath): string{
        return 'circle(' + clipPath.value[0].x + '% at ' + clipPath.value[1].x + '% ' + clipPath.value[1].y + '%)';
    }

    getEllipse(clipPath: ClipPath): string{
        return 'ellipse(' + Math.abs(50-clipPath.value[0].x) + '% ' + Math.abs(50-clipPath.value[1].y) + '% at ' + clipPath.value[2].x + '% ' + clipPath.value[2].y + '%)';
    }

    getClipPath(clipPath: ClipPath) {
        switch(clipPath.type) {
            case 'polygon':
                return this._sanitizer.bypassSecurityTrustStyle(this.getPolygon(clipPath));
            case 'ellipse':
                return this._sanitizer.bypassSecurityTrustStyle(this.getEllipse(clipPath));
            case 'circle':
                return this._sanitizer.bypassSecurityTrustStyle(this.getCircle(clipPath));
            case 'svg':
                return 'url(#svgPathTool)';

        }
        return '';
    }

    ngOnDestroy() {
        if (this._subs) {
            this._subs.forEach(s => s.unsubscribe());
        }
    }
}
