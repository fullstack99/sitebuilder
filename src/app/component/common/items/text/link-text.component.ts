import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Box } from '@app-lib/rect/rect';

import { Item, TextItemContent, Link, BorderInfo} from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'link-text-item',
	templateUrl: './link-text.component.html',
	styleUrls: ['./text.component.css']
})
export class LinkTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input() item: Item;
	@Output() outLink = new EventEmitter<Link>();
   
	@ViewChild('textEditorElem') textEditorElem: ElementRef;

	itemContent: TextItemContent;
	typing: boolean = false;
	padding: number = 10;
	extra_padding: number = 7;
	hp: number;
	wp: number;
	borderType: number = 2;
	borderWidth: number = 0;
	border_amount: number = 0;
	_box: Box;
	parent: HTMLElement;
	viewInited: boolean = false;

	get textHeight(): number {
		return (<HTMLElement>this.textEditorElem.nativeElement).offsetHeight;
	}

	get textWidth(): number {
		return (<HTMLElement>this.textEditorElem.nativeElement).offsetWidth;
	}   

	constructor(
		public _elementRef: ElementRef,
		public _changeDetectRef: ChangeDetectorRef,
		public _renderer: Renderer,
		public _sanitizer: DomSanitizer
	) {}

	ngAfterViewInit() {

		if (this.textEditorElem) {
			(this.textEditorElem.nativeElement as HTMLElement).innerHTML = (this.item.content as TextItemContent).text;
			let a_eles = (this.textEditorElem.nativeElement as HTMLElement).getElementsByTagName('a');
			for (let i = 0; i < a_eles.length; i++) {
				a_eles[i].addEventListener('click', (e) => {
					e.preventDefault();
					// e.stopPropagation();
				});
			}
		}

		if (this.itemContent.borderInfo.value) {
			this.borderWidth = this.itemContent.borderInfo.getDef(BorderInfo.empty()).borderWidth;
			this.border_amount = this.itemContent.borderInfo.getDef(BorderInfo.empty()).amount;
			this.padding += this.borderWidth;
			if (this.itemContent.borderInfo.getDef(BorderInfo.empty()).borderType == 1) {
				this.borderType = 1;
				if (this.itemContent.text)
					setTimeout(() => {
						this.setOptimizeHeight(true);
					});
				else
					setTimeout(() => {
						this.setBoxHeightType2();
					});
			}
			else {
				this.borderType = 2;
				setTimeout(() => {
					this.setBoxHeightType2();
				});
			}
		}
		else {
			setTimeout(() => {
				this.setBoxHeightType2();
			});
		}
		this.viewInited = true;
	}

	ngOnInit() {
		this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.itemContent = this.item.content as TextItemContent;		
	}

	ngOnChanges(changes: SimpleChanges) {
		const item = changes['item'];
		if (item && item.currentValue && this.viewInited) {
			this._box = (item.currentValue as Item).content.box;
		}
		if (this.parent) {
			this.parent.style.height = this.textHeight + 'px';
		}
	}	

	setOptimizeHeight(textFlag: boolean=false) {
		if ((this.item.content as TextItemContent).borderInfo) {
			let rd = 0.01 * this.border_amount;
			let rx = this.item.content.box.width() * rd - this.borderWidth;
			let minPw = 1;
			let minH = 0;
			for (let pw = 5; pw < rx/2; pw+=2) {
				let h = this.setBoxHeight(pw);
				if (h < minH || minH == 0) { 
					minPw = pw;
					minH = h;
				}
			}
			this.setBoxHeight(minPw, true, textFlag);
		}		
	}

	setBoxHeight(pw: number, flag: boolean=false, textFlag: boolean=false): number{
		if ((this.item.content as TextItemContent).borderInfo) {
			this.wp = pw;
			let rd = 0.01 * this.border_amount;
			let rx = this.item.content.box.width() * rd - this.borderWidth;
			let tw = this.item.content.box.width() - 2 * this.wp;
			
			(<HTMLElement>this.textEditorElem.nativeElement).style.setProperty('padding', '0px ' + this.wp + 'px');
			
			let th = this.textHeight + this.borderWidth;
			
			let kkk1 = 1.0 - this.wp / rx;
			
			let kk = 1.0 - Math.sqrt(1.0 - kkk1 * kkk1);
			
			let h = th / (1.0 - 2.0 * rd * kk);
			
			this.hp = (h - th) / 2;
			if (flag) {				
				(<HTMLElement>this.textEditorElem.nativeElement).style.setProperty('padding', Math.floor(this.hp)-8 + 'px ' + this.wp + 'px');
				if (textFlag) {					
					this._box = this.item.content.box.setBottom(this.item.content.box.top + h);		
					// this.itemResize.emit(this._box);
				}				
			}			
			return h;
		}
		return 0;
	}

	setBoxHeightType2() {		
		let padding = 5;		
		let ele = this.textEditorElem.nativeElement as HTMLElement;
		let cloneWidth = ele.offsetWidth - padding * 2;
		let cloneHeight = ele.offsetHeight;
		let extra_width = 0;
		
		if (this.borderWidth==0) {
			cloneWidth -= 1;
			extra_width = 1;
		}		
		
		let clone_ele = ele.cloneNode(true) as HTMLElement;
		clone_ele.style.setProperty('display', 'inline-block');
		//clone_ele.style.setProperty('display', 'block');
		document.body.appendChild(clone_ele);

		if (cloneWidth > clone_ele.offsetWidth)
			cloneWidth = clone_ele.offsetWidth;
					
		document.body.removeChild(clone_ele);

		if (cloneHeight == this.item.content.box.height() && cloneWidth == ele.offsetWidth)
			return;
		   
		if ((this.item.content as TextItemContent).borderInfo.value && this.border_amount) {			
			padding = Math.ceil(0 + this.border_amount - Math.sqrt(2) / 2 * this.border_amount + this.borderWidth);
		}

		if (this.textEditorElem) {
			(<HTMLElement>this.textEditorElem.nativeElement).style.setProperty('padding', padding - 2 + 'px ' + padding + 'px');
		}	   

		if (!this.isEmpty() && (this.typing || cloneHeight > this.item.content.box.height()-(padding-2+this.borderWidth)*2)) {			
			this._box = this.item.content.box
				.setBottom(this.item.content.box.top + cloneHeight + padding * 2 - 4 + this.borderWidth * 2)
				.setRight(this.item.content.box.left + cloneWidth + padding * 2 + this.borderWidth * 2 + extra_width);
			// this.itemResize.emit(this._box);
		}
		
		else if (!this.isEmpty() && cloneWidth < ele.offsetWidth - padding * 2 - extra_width) {
			this._box = this.item.content.box
				.setBottom(this.item.content.box.top + cloneHeight + padding * 2 + this.borderWidth * 2)
				.setRight(this.item.content.box.left + cloneWidth + padding * 2 + this.borderWidth * 2 + extra_width);
			// this.itemResize.emit(this._box);
		}
	}

	isEmpty() {		
		return ($(this.itemContent.text).text().trim() == '');		
	}

	onClick(link: any) {
		link = JSON.parse(link);
		if (!link.target) return;
		this.outLink.emit(link);
	}
		
	ngOnDestroy() {
		this.viewInited = false;
	}
}
