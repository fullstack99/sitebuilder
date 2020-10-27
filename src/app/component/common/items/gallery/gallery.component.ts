import {
	Component,
	Input,
	Output,
	HostBinding,
	ViewChild,
	ElementRef,
	AfterViewInit,
	Renderer,
	OnInit,
	EventEmitter
} from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import * as Rx from "rxjs/Rx";
import * as lodash from "lodash";
import * as imageUrl from "@app-lib/functions/image-url";

import {
	Item,
	CommonItemContent,
	GalleryInfo,
	GImage,
	ImagePath,
	Link
} from "@app/models";

@Component({
	moduleId: module.id,
	selector: "gallery-item",
	templateUrl: "./gallery.component.html",
	styleUrls: ["./gallery.component.css"]
})
export class GalleryComponent implements OnInit, AfterViewInit {
	@Input()
	item: Item;
	@Input()
	zoomImg: any;
	@Input()
	containerWidth: number = 1100;
	@Input()
	canvasScrollElem: HTMLElement;

	@Output()
	outLink = new EventEmitter<Link>();

	@ViewChild("thumbnails")
	public _thumbnails: ElementRef;

	public info: GalleryInfo;
	public rows = [];
	public cols = [];

	galleryItemPaddingLR = '0';
	galleryItemPaddingBottom = '0';
	descriptionTop = '0';

	private containerClientRect: any;
	private eleClientRect: any;
	private subs: Rx.Subscription[] = [];

	constructor(
		private sanitizer: DomSanitizer,
		private renderer: Renderer,
		private elementRef: ElementRef
	) {}

	ngOnInit() {
		this.info = (this.item.content as CommonItemContent<GalleryInfo>).info.value;
		this.rows = lodash.range(this.info.rows);
		this.cols = lodash.range(this.info.cols);
		this.galleryItemPaddingLR = `${this.info.spac - 20}px`;
		this.galleryItemPaddingBottom =  this.info.spac > 57 ? `${this.info.spac - 20}px` : '37px';
		this.descriptionTop = `calc(100% - ${this.info.spac > 57 ? this.info.spac - 20 : 37}px)`;
	}

	ngAfterViewInit() {
		this.containerClientRect = this.canvasScrollElem.getBoundingClientRect();
		this.eleClientRect = this.elementRef.nativeElement.getBoundingClientRect();
	}

	playAnimateThumb(event: MouseEvent) {
		let ele = event.srcElement;
		let speed = 0.5;
		this.renderer.setElementStyle(ele, "animation-duration", "" + speed + "s");
		$(ele)
			.addClass("animated " + this.info.animationType)
			.one(
				"webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",
				() => {
					$(ele).removeClass("animated " + this.info.animationType);
				}
			);
	}

	imageMouseOut(event: MouseEvent) {
		let zoomEle = this.zoomImg;
		if (zoomEle) zoomEle.style.display = "none";
	}

	imageZoom(event: MouseEvent, i: number) {
		if (!this.info.hover) return;

		let srcEle = event.srcElement as HTMLImageElement;
		let img = new Image();

		img.onload = event => {
			let imgHeight = img.height;
			let imgWidth = img.width;
			let eleHeight = srcEle.offsetHeight * 3;
			let eleWidth = Math.min(
				this.canvasScrollElem.offsetWidth - 20,
				srcEle.offsetWidth * 3
			);

			if (imgWidth > eleWidth) {
				imgHeight = Math.floor((imgHeight * eleWidth) / imgWidth);
				imgWidth = eleWidth;
			}

			if (imgHeight > eleHeight) {
				imgWidth = Math.floor((imgWidth * eleHeight) / imgHeight);
				imgHeight = eleHeight;
			}

			let parentEle = srcEle.parentElement;
			let parentClientRect = parentEle.getBoundingClientRect();

			let top = 0;
			let left = 0;

			let spaceH1 = this.containerClientRect.bottom - parentClientRect.bottom; // bottom space
			let spaceW1 = this.containerClientRect.right - parentClientRect.right; // right space

			if (spaceH1 < imgHeight) {
				let spaceH2 = parentClientRect.top - this.containerClientRect.top; // top space
				if (spaceH2 < imgHeight) {
					if (spaceH1 > spaceH2) {
						imgWidth = Math.floor((imgWidth * spaceH1) / imgHeight);
						imgHeight = spaceH1;
						top =
							this.item.content.box.top +
							parentClientRect.bottom -
							this.eleClientRect.top +
							this.canvasScrollElem.scrollTop;
					} else {
						imgWidth = Math.floor((imgWidth * spaceH2) / imgHeight);
						imgHeight = spaceH2;
						top =
							this.item.content.box.top -
							(imgHeight - (parentClientRect.top - this.eleClientRect.top));
					}
				} else {
					top =
						this.item.content.box.top -
						(imgHeight - (parentClientRect.top - this.eleClientRect.top));
				}
			} else {
				top =
					this.item.content.box.top +
					parentClientRect.bottom -
					this.eleClientRect.top +
					this.canvasScrollElem.scrollTop;
			}

			if (spaceW1 + 5 < imgWidth) {
				let spaceW2 = parentClientRect.left - this.containerClientRect.left; // left space
				if (spaceW2 + 5 < imgWidth) {
					left = Math.max((this.containerWidth - imgWidth) / 2, 10);
				} else {
					left =
						this.item.content.box.left -
						(imgWidth - (parentClientRect.left - this.eleClientRect.left)) -
						5;
				}
			} else {
				left =
					this.item.content.box.left +
					parentClientRect.right -
					this.eleClientRect.left -
					5;
			}

			let zoomEle = this.zoomImg;
			if (zoomEle) {
				zoomEle.style.backgroundImage = "url('" + srcEle.src + "')";
				zoomEle.style.display = "block";
				zoomEle.style.left = left + "px";
				zoomEle.style.top = top + "px";
				zoomEle.style.width = imgWidth + "px";
				zoomEle.style.height = imgHeight + "px";
				$(zoomEle)
					.addClass("animated fadeIn")
					.one(
						"webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",
						() => {
							$(zoomEle).removeClass("animated fadeIn");
						}
					);
			}
		};
		img.src = srcEle.src;
		// let eles = event.srcElement.parentElement.getElementsByClassName('img-zoom-lens');
		// imageZoom.imageZoom(srcEle, zoomEle, eles.item(0) as HTMLDivElement);
	}

	backgroundImage(gImage: GImage): SafeStyle {
		if (gImage.image["createdate"]) {
			delete gImage.image["createdate"];
		}
		return gImage
			? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(gImage.image))
			: "";
	}

	backgroundSrcUrl(gImage: GImage) {
		if (gImage && gImage.image["createdate"]) {
			delete gImage.image["createdate"];
		}
		return gImage ? imageUrl.imageSrcUrl(gImage.image) : "";
	}

	onClick(i: number) {
		if (!this.info.gImages[i] || !this.info.gImages[i].link) return;
		this.outLink.emit(this.info.gImages[i].link);
	}
}
