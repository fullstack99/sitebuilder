import { Directive, Input, ElementRef, AfterViewInit, OnInit, OnDestroy, OnChanges, ChangeDetectorRef, Renderer, HostBinding, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BorderInfo } from '@app/models';

export { BorderInfo } from '@app/models';

@Directive({
    selector: '[border]'
})
export class BorderDirective implements OnChanges {
    @Input('borderInfo') borderInfo: BorderInfo;
    @Input('defaultWidth') defaultWidth: boolean = false;

    constructor(
        public _elementRef: ElementRef,
        public _renderer: Renderer,
        public _sanitizer: DomSanitizer
    ) {}
    ngOnChanges() {
    }

    @HostBinding('style.border') get border() {
        let width = 0;
        if (!this.defaultWidth && this.borderInfo)
            width = this.borderInfo.borderWidth;

        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle(`${width}px solid ${this.borderInfo.borderColor}`);
        else
            return this._sanitizer.bypassSecurityTrustStyle(`1px solid transparent`);
    }

    @HostBinding('style.borderTopLeftRadius') get borderLeftTop() {
        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle(this.getRadius(this.borderInfo.lTop));
        return '0px';
    }

    @HostBinding('style.borderTopRightRadius') get borderRightTop() {
        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle(this.getRadius(this.borderInfo.rTop));
        return '0px';
    }

    @HostBinding('style.borderBottomLeftRadius') get borderLeftBottom() {
        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle(this.getRadius(this.borderInfo.lBottom));
        return '0px';
    }

    @HostBinding('style.borderBottomRightRadius') get borderRightBottom() {
        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle(this.getRadius(this.borderInfo.rBottom));
        return '0px';
    }

    @HostBinding('style.boxShadow') get borderShadow() {
        if (this.borderInfo)
            return this._sanitizer.bypassSecurityTrustStyle('' + this.borderInfo.shadow + 'px ' + this.borderInfo.shadow + 'px 5px rgba(0,0,0,0.4)');
        return '0px';
    }

    @HostBinding('style.overflow') get overflow() {
        if (this.borderInfo && this.borderInfo.borderType == 1)
            return this._sanitizer.bypassSecurityTrustStyle('hidden');
        return null;
    }

    getRadius(borderFlag: boolean): string{
        let result: string = '0px';
        if (borderFlag) {
            if (this.borderInfo.borderType == 1) {
                result = this.borderInfo.amount + '%';
            }
            else {
                if (this.defaultWidth) {
                    result = this.borderInfo.amount - this.borderInfo.borderWidth + 'px';
                }
                else
                    result = this.borderInfo.amount + 'px';
            }
        }
        return result;
    }
}
