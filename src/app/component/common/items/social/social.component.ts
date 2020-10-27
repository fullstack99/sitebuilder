import { Component, Input, Output, HostBinding, ElementRef, Renderer, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { Item, CommonItemContent, DefaultRibbons, SocialInfo } from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'social-item',
	templateUrl: './social.component.html',
	styleUrls: ['./social.component.css']
})

export class SocialComponent implements OnInit {
	@Input() item: Item;
	@Input() editable = false;
	
	@ViewChild('result') private _result: ElementRef;

	public ribbons = [];
	
	private type = 'color';
	private elem: HTMLElement; //HTMLInputElement

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer,
		private sanitizer: DomSanitizer
	) {
		this.elem = this.elementRef.nativeElement as HTMLElement;
	}

	ngOnInit() {
		const info = (this.item.content as CommonItemContent<SocialInfo>).info;
		if (info.hasValue()) {
			this.type = info.get().type;
			const ribbons = info.get().ribbons;
			this.ribbons = DefaultRibbons.filter(r => ribbons.indexOf(r.id) >= 0 ) ;
			console.log(this.ribbons);
		}
		// let ele: HTMLElement = document.createElement('img') as HTMLElement;
		// this.setStyle(ele);
		// this.elem.appendChild(ele);
		// if ((this.item.content as SocialItemContent).info.hasValue()) {
		//	 if ((this.item.content as SocialItemContent).info.get().type == 1) //social
		//		 this.setSocialResult();
		//	 else
		//		 this.setFrameResult();
		// }
	}

	setFrameResult() {
		// let resultEle: HTMLElement = this._result.nativeElement as HTMLElement;
		// let ele: HTMLIFrameElement = document.createElement('iframe') as HTMLIFrameElement;
		// ele.src = (this.item.content as SocialItemContent).info.get().url;
		// // ele.src = 'https://player.vimeo.com/social/78675881';
		// ele.style.setProperty('width', '100%');
		// ele.style.setProperty('height', '100%');
		// resultEle.appendChild(ele);
	}

	setSocialResult() {
		// let resultEle: HTMLElement = this._result.nativeElement as HTMLElement;
		// let ele = document.createElement('Social') as HTMLSocialElement;
		// ele.src = (this.item.content as SocialItemContent).info.get().url;

		// switch ((this.item.content as SocialItemContent).info.get().playMode) {
		//	 case 'looping':
		//		 ele.loop = true;
		//		 ele.autoplay = true;
		//		 break;
		//	 case 'auto':
		//		 ele.loop = false;
		//		 ele.autoplay = true;
		//		 break;
		//	 default:
		//		 ele.loop = false;
		//		 ele.autoplay = false;
		//		 break;
		// }

		// switch ((this.item.content as SocialItemContent).info.get().showControls) {
		//	 case 'always':
		//		 ele.controls = true;
		//		 $(ele).mouseenter(() => {
		//			 ele.controls = true;
		//		 });
		//		 $(ele).mouseleave(() => {
		//			 ele.controls = true;
		//		 });
		//		 break;
		//	 case 'hover':
		//		 $(ele).mouseenter(() => {
		//			 ele.controls = true;
		//		 });
		//		 $(ele).mouseleave(() => {
		//			 ele.controls = false;
		//		 });
		//		 break;
		//	 default:
		//		 ele.removeAttribute('controls');
		//		 $(ele).mouseenter(() => {
		//			 ele.controls = false;
		//		 });
		//		 $(ele).mouseleave(() => {
		//			 ele.controls = false;
		//		 });
		//		 break;
		// }
		// ele.style.setProperty('width', '100%');
		// ele.style.setProperty('height', '100%');
		// resultEle.appendChild(ele);
	}

	// setBorder(ele: HTMLElement) {
	//	 if ((this.item.content as SocialItemContent).borderInfo) {
	//		 let border = (this.item.content as SocialItemContent).borderInfo.get();
	//		 ele.style.setProperty('border', border.borderWidth+'px solid'+ border.borderColor);
	//		 ele.style.setProperty('border-top-left-radius', this.getRadius(border.lTop));
	//		 ele.style.setProperty('border-top-right-radius', this.getRadius(border.rTop));
	//		 ele.style.setProperty('border-bottom-left-radius', this.getRadius(border.lBottom));
	//		 ele.style.setProperty('border-bottom-right-radius', this.getRadius(border.rBottom));
	//	 }
	// }

	// getRadius(borderFlag: boolean): string {
	//	 let result: string = '0px';
	//	 if (borderFlag && (this.item.content as SocialItemContent).borderInfo) {
	//		 if ((this.item.content as SocialItemContent).borderInfo.get().borderType == 1)
	//			 result = (this.item.content as SocialItemContent).borderInfo.get().amount + '%';
	//		 else
	//			 result = (this.item.content as SocialItemContent).borderInfo.get().amount + 'px';
	//	 }
	//	 return result;
	// }

	backgroundRibbon(ribbon): SafeStyle {
		let url: string;
		if (this.type == 'color')
			url = ribbon.color;
		else
			url = ribbon.gray;
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : '';
	}
}
