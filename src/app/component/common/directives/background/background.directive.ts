import { Directive, Input, ElementRef, AfterViewInit, OnInit, OnDestroy, OnChanges, Renderer, HostListener, Output, EventEmitter, SimpleChanges, Renderer2 } from '@angular/core';
import * as lodash from 'lodash';
import { BackgroundInfo, BackgroundColorInfo, BackgroundImageInfo, BackgroundTilingInfo, BackgroundVideoInfo,
		 BorderInfo, ImagePath } from '@app/models';
import * as imageUrl from '@app-lib/functions/image-url';

@Directive({
	selector: '[background]'
})
export class BackgroundDirective implements OnInit, OnDestroy, OnChanges, AfterViewInit {
	@Input() backgroundInfo: BackgroundInfo;
	@Input() zIndex: number = 0;
	@Input('backgroundborderInfo') borderInfo: BorderInfo;
	@Input() containerWidth: number = 1100;
	@Input() containerHeight: number = 0;
	@Input() backroundResizable: boolean = true;
	@Input() canvasScrollTop: number = 0;
	@Input() scale: number = 1;

	@Output() backgroundHeight = new EventEmitter<number>();

	public elem: HTMLElement; //HTMLInputElement

	public backEle: HTMLElement;
	public backEleColor: HTMLElement;
	public backImageBehindColor: HTMLElement;
	public backImage: HTMLElement;
	public backTilingBehindColor: HTMLElement;
	public backTiling: HTMLElement;
	public speed = 0.01;
	public backgroundImage: BackgroundImageInfo;
	public BackgroundTilingInfo: BackgroundTilingInfo;

	public parallaxElems: any = [];

	private backImagePos: any = [0, 0];
	private backImageSize: any = [0, 0];
	private viewInited: boolean = false;

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer2
	  ) {
		  this.elem = this.elementRef.nativeElement as HTMLElement;
	}

	ngOnInit() {
		if (!this.backgroundInfo) return;
		// this.elem.style.setProperty('position', 'relative');
		// this.elem.style.setProperty('z-index', '1');

		this.backEle = document.createElement('div') as HTMLElement;
		this.backEleColor = document.createElement('div') as HTMLElement;

		this.backImageBehindColor = document.createElement('div') as HTMLElement;
		this.backImage = document.createElement('div') as HTMLElement;

		this.backTilingBehindColor = document.createElement('div') as HTMLElement;
		this.backTiling = document.createElement('div') as HTMLElement;

		this.backEle.setAttribute('class', 'sitebackground');
		this.backEleColor.setAttribute('class', 'sitebackground-color');

		this.backImageBehindColor.setAttribute('class', 'sitebackground-behind-color');
		this.backImageBehindColor.style.setProperty('overflow', 'hidden');
		this.backImage.setAttribute('class', 'sitebackground-image');

		this.backTilingBehindColor.setAttribute('class', 'sitebackground-tiling-behind-color');
		this.backTiling.setAttribute('class', 'sitebackground-tiling');

		// this.backImage.setAttribute('id', 'sitebackground-image');

		this.backEle.appendChild(this.backEleColor);
		this.backEle.appendChild(this.backTilingBehindColor);
		this.backEle.appendChild(this.backTiling);
		this.backEle.appendChild(this.backImageBehindColor);
		this.backEle.appendChild(this.backImage);
		this.elem.appendChild(this.backEle);

		if (!this.backroundResizable)
		  this.renderer.setStyle(this.backEle, 'overflow', 'hidden');

		// this.backEle.style.transformOrigin = 'left top';
		// this.backEle.style.transform = 'scale(' + 1100 / this.containerWidth + ')';

		this.setBasicStyle(this.backgroundInfo.backgroundImage ? this.backgroundInfo.backgroundImage.imageScrolling == 'parallax' : null);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited || !this.backgroundInfo) return;
		if (changes['backgroundInfo'] || changes['containerWidth']) {
			this.backImageBehindColor.innerHTML = '';
			this.backImageBehindColor.style.setProperty('height', '0px');
			this.setBasicStyle(this.backgroundInfo.backgroundImage ? this.backgroundInfo.backgroundImage.imageScrolling == 'parallax' : null);
			if (!this.backgroundInfo.backgroundImage) {
				this.backgroundHeight.emit(0);
			}
		}

		if (this.backgroundInfo.backgroundImage && changes['canvasScrollTop']) {
			let children = this.backImageBehindColor.childNodes;
			if (this.backgroundInfo.backgroundImage.imageScrolling == 'freeze') {
				this.backImage.style.setProperty('top', Math.max(0, this.backImagePos[1] + this.canvasScrollTop) + 'px');
				this.backImage.style.setProperty('max-height', Math.min(this.backImageSize[1], this.elem.offsetHeight - this.canvasScrollTop) + 'px');
				this.setBehindImageColorPosition(this.backImage);
			} else {
				for (let i = 0; i < children.length; i++) {
					let ele = (children.item(i) as HTMLElement);
					ele.style.setProperty('background-position-y', -732 * i + this.elem.parentElement.scrollTop / this.scale + 'px');
					// ele.style.setProperty('background-position-y', -732 * i + this.elem.parentElement.scrollTop + 'px');
					// ele.style.setProperty('background-position-y', -1 * this.containerHeight * i + this.elem.parentElement.scrollTop / this.scale + 'px');
				}
			}
		}
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	setDefaultStyle(ele: HTMLElement) {
		ele.style.setProperty('z-index', '' + this.zIndex);
		ele.style.setProperty('position', 'absolute');
		ele.style.setProperty('left', '0px');
		ele.style.setProperty('top', '0px');
		ele.style.setProperty('width', '100%');
		ele.style.setProperty('height', '100%');
		ele.style.setProperty('background-attachment', '');
		ele.style.setProperty('background-size', '');
		ele.style.setProperty('background-image', '');
	}

	setBasicStyle(parallax: boolean) {
		this.setDefaultStyle(this.backEle);
		this.setDefaultStyle(this.backEleColor);
		this.setDefaultStyle(this.backTilingBehindColor);
		this.setDefaultStyle(this.backTiling);
		this.setDefaultStyle(this.backImageBehindColor);
		this.setDefaultStyle(this.backImage);

		this.setBackgroundColorGradient(this.backEleColor);

		if (this.backgroundInfo.backgroundImage) {
			if (this.backgroundInfo.backgroundTiling) {
				this.backTilingBehindColor.style.setProperty('background-color', this.backgroundInfo.backgroundTiling.tilingBehindColor);
				this.setImageStyle(this.backTiling, this.backgroundInfo.backgroundTiling.image, this.backgroundInfo.backgroundTiling.tilingOpacity);
			}
			this.backTiling.style.setProperty('background-repeat', 'repeat');
			this.setBorder(this.backTilingBehindColor);

			if (this.backgroundInfo.backgroundImage) {
				this.backImageBehindColor.style.setProperty('background-color', this.backgroundInfo.backgroundImage.imageBehindColor);
				if (parallax) {
					this.setBackgroundSubImages();
				} else {
					let imageScrolling: string = this.backgroundInfo.backgroundImage.imageScrolling;
					this.setImageStyle(this.backImage, this.backgroundInfo.backgroundImage.image, this.backgroundInfo.backgroundImage.imageOpacity);
					this.backImage.style.setProperty('background-repeat', 'no-repeat');

					if (this.backgroundInfo.backgroundImage.image) {
						if (imageScrolling == 'move') {
							const imageSize: Promise<[number, number]> = this.setElementOrBackgroundSize(this.backImage, this.backgroundInfo.backgroundImage.image, 2, false);
							imageSize.then(value => {
								this.backImageSize = value;
								this.backgroundHeight.emit(value[1]);
								this.setElementPosition(this.backImage, value);
								this.setBehindImageColorPosition(this.backImage);

							});
						} else if (imageScrolling == 'freeze') {
							const imageSize: Promise<[number, number]> = this.setElementOrBackgroundSize(this.backImage, this.backgroundInfo.backgroundImage.image, 2, false, true);
							imageSize.then(value => {
								this.backImageSize = value;
								this.backgroundHeight.emit(value[1]);
								this.setElementPosition(this.backImage, value);
								this.setBehindImageColorPosition(this.backImage);
							});
						}
					}
				}
			}
			this.setBorder(this.backImageBehindColor);
		}
	}

	setImageStyle(ele: HTMLElement, image: ImagePath, opacity: number) {
		ele.style.setProperty('opacity', (opacity / 100).toString());
		if (image != null)
			ele.style.setProperty('background-image', imageUrl.imageUrl(image));
		this.setBorder(ele);
	}

	setBorder(ele: HTMLElement) {
		if (this.borderInfo) {
			ele.style.setProperty('border-top-left-radius', this.getRadius(this.borderInfo.lTop));
			ele.style.setProperty('border-top-right-radius', this.getRadius(this.borderInfo.rTop));
			ele.style.setProperty('border-bottom-left-radius', this.getRadius(this.borderInfo.lBottom));
			ele.style.setProperty('border-bottom-right-radius', this.getRadius(this.borderInfo.rBottom));
		}
	}

	async setBackgroundSubImages() {
		const images: ImagePath[] = this.backgroundInfo.backgroundImage && this.backgroundInfo.backgroundImage.multiImages ? this.backgroundInfo.backgroundImage.multiImages.filter((s) => s != null) : [];
		let h = 0;
		images.forEach((i, index) => {
			const subElem: HTMLElement = document.createElement('div') as HTMLElement;
			this.setImageStyle(subElem, i, this.backgroundInfo.backgroundImage.imageOpacity); // set src and opacity to Image Element
			subElem.style.setProperty('width', '100%');
			// subElem.style.setProperty('height', this.containerHeight + 'px');
			subElem.style.setProperty('height', '732px');
			subElem.style.setProperty('z-index', '' + this.zIndex);
			subElem.style.setProperty('background-repeat', 'no-repeat');
			// subElem.style.setProperty('background-size', '100% 100%');
			subElem.style.setProperty('background-size', '100%');
			subElem.style.setProperty('background-position-x', 'center');
			// subElem.style.setProperty('background-position-y', -1 * this.containerHeight * index + 'px');
			subElem.style.setProperty('background-position-y', -732 * index + 'px');
			this.backImageBehindColor.appendChild(subElem);
		});
		this.backImageBehindColor.style.setProperty('max-height', '100%');
		// this.backgroundHeight.emit(this.containerHeight * images.length);
		this.backgroundHeight.emit(732 * images.length);
	}

	setElementOrBackgroundSize(ele: HTMLElement, image: ImagePath, target: number, height100: boolean = false, parallax: boolean = false, first: boolean = false): Promise<[number, number]> { // target: background (0),  element (1), both (2), //height100 : 100%
		return new Promise(resolve => {
			const img = new Image;
			img.onload = (ev) => {
				let imgHeight: number = img.height;
				let imgWidth: number = img.width;
				let width: string = img.width + 'px';
				let height: string = img.height + 'px';

				if (imgWidth > this.backEle.offsetWidth) {
					imgHeight = imgHeight * this.backEle.offsetWidth / imgWidth;
					imgWidth = this.backEle.offsetWidth;
					width = '100%';
					height = imgHeight + 'px';
				}

				if (target == 0) {
					ele.style.setProperty('background-size', width + ' ' + height);
				} else if (target == 1) {
					ele.style.setProperty('height',  height100 ? '100%' : height);
					ele.style.setProperty('max-height', Math.max(imgHeight, this.containerHeight) + 'px');
				} else if (target == 2) {
					ele.style.setProperty('background-size', width + ' ' + height);
					ele.style.setProperty('width', width);
					ele.style.setProperty('height', height100 ? '100%' : height);
					ele.style.setProperty('max-width', '100%');
					ele.style.setProperty('max-height', Math.max(imgHeight, this.containerHeight) + 'px');
				}

				if (parallax) {
					ele.style.setProperty('background-position', 'center 0px');
					ele.style.setProperty('margin-left', 'auto');
					ele.style.setProperty('margin-right', 'auto');
				}

				resolve([imgWidth, imgHeight]);
			};

			if (img)
				img.src = imageUrl.imageSrcUrl(image);
			else
				resolve([0, 0]);
		});
	}

	setElementPosition(ele: HTMLElement, imageSize: [number, number]) {
		if (!this.backgroundInfo.backgroundImage || !this.backgroundInfo.backgroundImage.image)
			return;

		let backEleWidth = this.elem.offsetWidth;
		let backEleHeight = this.elem.offsetHeight;
		let eleWidth = ele.offsetWidth;
		let eleHeight = ele.offsetHeight;

		if (this.backgroundInfo.backgroundImage) {
			switch (this.backgroundInfo.backgroundImage.imagePosition) {
				case "top left":
					this.backImagePos = [0,0];
					break;
				case "top center":
					this.backImagePos = [Math.max(0, (backEleWidth - eleWidth) / 2), 0];
					break;
				case "top right":
					this.backImagePos = [Math.max(0, (backEleWidth - eleWidth)), 0];
					break;
				case "left":
					this.backImagePos = [0, Math.max(0, (backEleHeight - eleHeight) / 2)];
					break;
				case "center":
					this.backImagePos = [Math.max(0, (backEleWidth - eleWidth) / 2), Math.max(0, (backEleHeight - eleHeight) / 2)];
					break;
				case "right":
					this.backImagePos = [Math.max(0, (backEleWidth - eleWidth-2)), Math.max(0, (backEleHeight - eleHeight) / 2)];
					break;
				case "bottom left":
					this.backImagePos = [0, Math.max(0, (backEleHeight - eleHeight-2))];
					break;
				case "bottom center":
					this.backImagePos = [Math.max(0, (backEleWidth - eleWidth) / 2), Math.max(0, (backEleHeight - eleHeight-2))];
					break;
				case "bottom right":
					this.backImagePos = [Math.max(0,(backEleWidth - eleWidth-2)), Math.max(0,(backEleHeight - eleHeight-2))];
					break;
			}
			ele.style.setProperty('left', '' + this.backImagePos[0] + 'px');
			ele.style.setProperty('top', '' + this.backImagePos[1] + 'px');
		}
	}

	setBehindImageColorPosition(ele: HTMLElement) {
		this.backImageBehindColor.style.setProperty('left', ele.style.left);
		this.backImageBehindColor.style.setProperty('top', ele.style.top);
		this.backImageBehindColor.style.setProperty('width', ele.style.width);
		this.backImageBehindColor.style.setProperty('height', ele.style.height);
		this.backImageBehindColor.style.setProperty('max-height', ele.style.maxHeight);
	}

	setBackgroundColorGradient(ele: HTMLElement) {
		let result: string = "";
		let direction: number = 0;
		let amount: string = "0%";

		if (!this.backgroundInfo.backgroundColor) {
			result = 'transparent';
			ele.style.setProperty('background', result);
			this.setBorder(ele);
			return;
		}

		if (this.backgroundInfo.backgroundColor.vertical > 0) {
			direction = 0;
			amount = this.backgroundInfo.backgroundColor.vertical + "%";
		}
		if (this.backgroundInfo.backgroundColor.horizontal > 0) {
			direction = 1;
			amount = this.backgroundInfo.backgroundColor.horizontal + "%";
		}

		if (amount == '0%') {
			result = this.backgroundInfo.backgroundColor.startColor;
		}
		else {
			if (navigator.userAgent.indexOf("Safari") != -1 && parseInt(navigator.appVersion) <= 6 && navigator.userAgent.indexOf("Chrome") == -1) {
				result = "-webkit-linear-gradient(";
				if (direction == 0) {
					result += " top";
				}
				else {
					result += " left";
				}
			}
			else {
				if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
					result = "-o-linear-gradient(";
				}
				else if (navigator.userAgent.indexOf("Firefox") != -1) {
					result = "-moz-linear-gradient(";
				}
				else if (navigator.userAgent.indexOf("Chrome") != -1) {
					result = "linear-gradient(to";
				}
				else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) //IF IE > 10
				{
					result = "linear-gradient(";
				}
				else {
					result = "linear-gradient(to";
				}

				if (direction == 0) {
					result += " bottom";
				}
				else {
					result += " right";
				}
			}
			result += ", " + this.backgroundInfo.backgroundColor.startColor + " " + amount + ", " + this.backgroundInfo.backgroundColor.endColor + ")";
		}
		if (result == '')
			result = 'transparent';
		ele.style.setProperty('background', result);
		this.setBorder(ele);
	}

	getRadius(borderFlag: boolean): string {
		let result: string = '0px';
		if (borderFlag) {
			if (this.borderInfo.borderType == 1)
				result = this.borderInfo.amount + '%';
			else
				result = lodash.max([0,this.borderInfo.amount - this.borderInfo.borderWidth]) + 'px';
		}
		return result;
	}

	ngOnDestroy() {
		this.viewInited = false;
	}
}

