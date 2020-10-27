import { Component, Input, Output, ElementRef, OnInit, EventEmitter, ViewChild, AfterViewInit, Renderer } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Item, CommonItemContent, ButtonInfo, Link } from '@app/models';

@Component({
    moduleId: module.id,
    selector: 'button-item',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.css']
})
export class ButtonComponent implements OnInit, AfterViewInit {
    @Input() item: Item;
    @Input() selected  = false;
    
    @Output() outLink = new EventEmitter<Link>();
    
    public itemContent: CommonItemContent<ButtonInfo>;
    private parent: string = '';

    @ViewChild('resultButtonContainer') resultButtonContainer: ElementRef;
    @ViewChild('resultButton') resultButton: ElementRef;
       
    constructor( 
        private elementRef: ElementRef,
        private renderer: Renderer,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {        
        this.itemContent = this.item.content as CommonItemContent<ButtonInfo>;
    }
    
    ngAfterViewInit() {
        if (this.resultButton) {
            if (this.itemContent.info.hasValue()) {
                let ele = (<HTMLElement>this.resultButton.nativeElement);
                ele.innerHTML = (this.item.content as CommonItemContent<ButtonInfo>).info.get().text;
                //ele.style.marginTop = ((<HTMLElement>this.resultButtonContainer.nativeElement).offsetHeight - ele.offsetHeight)/2 + 'px';
            }                
        }        
    }

    onHoverButton(event: Event) {        
        if (this.itemContent.info.value)
            this.renderer.setElementStyle(this.resultButtonContainer.nativeElement, 'background-color', this.itemContent.info.value.hoverColor);
    }

    onLeaveButton(event: Event) {
        if (this.itemContent.info.value)
            this.renderer.setElementStyle(this.resultButtonContainer.nativeElement, 'background-color', this.itemContent.info.value.backColor);
    }    

    getButtonText(text: string): SafeHtml {
        return (this.sanitizer.bypassSecurityTrustHtml(text));
    }

    getShadow(): SafeStyle {
        let result = '';
        if (this.itemContent.info.value) {
            let bevel = this.itemContent.info.value.bevel;
            let glow = this.itemContent.info.value.glow;
            let shadow = this.itemContent.info.value.shadow;
            result = shadow + 'px ' + shadow + 'px ';
            result += glow + 'px rgba(0,0,0,0.4),';
            result += ' inset ' + bevel + 'px ' + bevel + 'px 2px rgba(255,255,255,0.6),';
            result += ' inset -' + bevel + 'px -' + bevel + 'px 2px rgba(0,0,0,0.4)';
        }        
        return (this.sanitizer.bypassSecurityTrustStyle(result));
    }
    
    onClick() {        
        if (!this.itemContent.link) return;        
        this.outLink.emit(this.itemContent.link);
    }
}