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
	ImagePath,
	SlideShowInfo,
	Slide,
	Item,
	CommonItemContent,
	Link
} from "@app/models";
import { AppService } from '@app/app.service';
import { environment } from '@app-environments/environment';

@Component({
	moduleId: module.id,
	selector: "slideshow-item",
	templateUrl: "./slideshow.component.html",
	styleUrls: ["./slideshow.component.css"]
})
export class SlideshowComponent implements OnInit, AfterViewInit {
	@Input() item: Item;
	@Input() loading: boolean = false;

	@Output() changeActiveSlideIndex = new EventEmitter<number>();
	@Output() outLink = new EventEmitter<Link>();
	@ViewChild("result") public _result: ElementRef;

	public playAnimation = new Rx.Subject<number>();
	public info: SlideShowInfo;

	public _ele: HTMLElement;
	public switSpeed: number = 5000;
	public sildeDispIndex: number = 0;
	public dispIndex: number = 0;
	public sildesNum: number = 20;
	public slideSpeed: number = 0;
	public _slides: Slide[] = [];

	private subs: Rx.Subscription[] = [];

	constructor(
		private sanitizer: DomSanitizer,
		private elementRef: ElementRef,
		private renderer: Renderer,
		private _appService: AppService,
	) {}

	ngOnInit() {
		this.info = (this.item.content as CommonItemContent<SlideShowInfo>).info.value;
		this._slides = lodash.filter(this.info.slides, slide => {
			return slide && slide.image ? true : false;
		});

		this.sildesNum = this._slides.length - 1;
		this.slideSpeed = 0;

		if (this.info.animationSpeed > 0 && this.info.animationSpeed < 1)
			this.slideSpeed = 1 - this.info.animationSpeed;
		else if (this.info.animationSpeed == 1) this.slideSpeed = 0.001;

		this._ele = this._result.nativeElement as HTMLElement;

		switch (this.info.guideType) {
			case "thumbnails":
				$(this._ele).addClass("result-thumbnails");
				break;
			case "dots":
				$(this._ele).addClass("result-dot");
				break;
		}

		if (this.info.animationSpeed > 0) {
			$(this._ele).addClass("animated " + this.info.animationType);
			this.renderer.setElementStyle(
				this._ele,
				"animation-duration",
				"" + 10 * this.slideSpeed + "s"
			);
			this.carousel();
		} else if (this.sildesNum > 0) {
			this._ele.style.setProperty(
				'background-image',
				imageUrl.imageUrl(this.info.slides[0].image)
			);
			this._appService.activeSlideIndex[this.item.uid] = 0;
		}
		// this._subs = [
		//		 this.playAnimation.subscribe(n => {
		//				 if (!this._result)
		//						 return;
		//				 let ele = this._result.nativeElement as HTMLElement;
		//				 this.renderer.setElementStyle(ele, 'animation-duration', '0s');
		//				 //this.renderer.setElementStyle(ele, 'animation-duration', '1s');
		//				 ele.style.setProperty('background-image', `url('${this.item.slides[n].imageUrl}')`);
		//				 $(ele).addClass('animated ' + this.item.animationType).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
		//						 $(ele).removeClass('animated ' + this.item.animationType);
		//						 //this.playAnimation.next((n < (this.item.slides.length - 1)) ? n+1 : 0);
		//						 this.playAnimation.next(n < 2 ? n + 1 : 0);
		//				 });
		//		 })
		// ];
	}

	ngAfterViewInit() {
		if (!this._result) return;
	}

	carousel() {
		this.dispIndex++;
		if (this.dispIndex > this.sildesNum)
			this.dispIndex = 0;

		if (this.dispIndex < this.sildeDispIndex) {
			this.moveThumb(-1, null);
		}

		if (this.dispIndex > this.sildeDispIndex + 2) {
			this.moveThumb(1, null);
		}

		if (!environment['test']) {
			setTimeout(() => this.carousel(), 10 * this.slideSpeed * 1000 + 10);
		}
		this.setDispSlideBackground();
	}

	gotoSlide(i: number, e: MouseEvent) {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		this.dispIndex = i;
		if (i < 0)
			return;
		this.setDispSlideBackground();
	}

	onSlideClick(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	onArrowClick(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	setDispSlideBackground() {
		const slide = (this.item.content as CommonItemContent<SlideShowInfo>).info
			.value.slides[this.dispIndex];

		if (slide && slide.image)
			this._ele.style.setProperty(
				'background-image',
				imageUrl.imageUrl(slide.image)
			);
		else this._ele.style.setProperty('background-image', '');

		this.changeActiveSlideIndex.emit(this.dispIndex);
	}

	moveThumb(i: number, e: MouseEvent) {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		const newDispIndex = this.sildeDispIndex + i;
		if (newDispIndex < 0) {
			if (this.dispIndex - 1 >= 0)
				this.gotoSlide(this.dispIndex - 1, null);
		} else if (newDispIndex > this.sildesNum - 2) {
			if (this.dispIndex + 1 <= this.sildesNum)
				this.gotoSlide(this.dispIndex + 1, null);
		} else {
			this.sildeDispIndex = newDispIndex;
			if (this.dispIndex < this.sildeDispIndex)
				this.gotoSlide(this.sildeDispIndex, null);
			else if (this.dispIndex > this.sildeDispIndex + 2)
				this.gotoSlide(this.sildeDispIndex + 2, null);
		}
		this._slides[0].link
	}

	defaultBackgroundImage(): SafeStyle {
		return this._slides[0] && this._slides[0].image
			? this.sanitizer.bypassSecurityTrustStyle(
					imageUrl.imageUrl(this._slides[0].image)
				)
			: '';
	}

	backgroundImage(image: ImagePath): SafeStyle {
		if (image && image["createdate"]) {
			delete image["createdate"];
		}
		return image
			? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image))
			: "";
	}

	onClick() {
		if (!this.info.slides[this.dispIndex].link) return;
		this.outLink.emit(this.info.slides[this.dispIndex].link);
	}
}
