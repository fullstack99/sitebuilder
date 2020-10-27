import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChildren, ElementRef, HostListener, Input, OnChanges, SimpleChanges,
	QueryList, AfterViewInit, Renderer
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { updateArrayAt, moveArrayElements, padArray, withArray, removeArrayElem } from '@app-lib/array/array';
import { Maybe } from '@app-lib/maybe/maybe';
import { GalleryInfo, GImage,  CommonItemContent } from '@app/models';
import { GalleryService } from '@app-dialogs/gallery-dialog/gallery.service';

@Component({
	moduleId: module.id,
    selector   : 'gallery-theme',
	templateUrl: './themes.component.html',
	styleUrls: ['./themes.component.css']
})

export class GalleryThemesComponent implements OnInit, OnDestroy {	
	@Output('selectedTheme') selectedTheme = new EventEmitter<GalleryInfo>();

    public _galleryThemes: GalleryInfo[] = [GalleryInfo.empty()];
    public _activeIndex: number = 0;
    public _prev = new Rx.Subject<void>();
	public _next = new Rx.Subject<void>();
	public _selectTheme = new Rx.Subject<number>();
    public dispRange = lodash.range(0, 1);

    public _subs: Rx.Subscription[] = [];

    constructor(
		public _changeDetector: ChangeDetectorRef,
		public _elementRef: ElementRef,		
		public _galleryService: GalleryService,
		public _sanitizer: DomSanitizer,
		public _renderer: Renderer
	) { }

    ngOnInit() {

        const moreThemes = this.getThemes().publish().refCount();

        this._subs = [
            moreThemes.subscribe(r=> {
                this._galleryThemes = [...this._galleryThemes, ...r];
            }),
            this._prev.subscribe(() => {
                this._activeIndex = lodash.clamp(this._activeIndex - 1, 0, this._galleryThemes.length - this.dispRange.length);
            }),
            this._next.subscribe(() => {
                this._activeIndex = lodash.clamp(this._activeIndex + 1, 0, this._galleryThemes.length - this.dispRange.length);
            }),
			this._selectTheme.subscribe(n=> {
                this.selectedTheme.emit(this._galleryThemes[n]);
            })
		];

        this.dispRange = lodash.range(0,this._galleryThemes.length);
    }

    getThemes(): Rx.Observable<GalleryInfo[]> {
        return this._galleryService.getGalleryThemes();        
    }

    getImageURL(gimage: GImage): SafeStyle {
		if (gimage.image!=undefined)
			return this._sanitizer.bypassSecurityTrustStyle(`url('${gimage.image.location+'/'+gimage.image.name}')`);
		return '';
	}

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }
    
}


