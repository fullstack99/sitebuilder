import { Component, Input, Output, EventEmitter, HostBinding, ViewChild, ViewChildren, ElementRef, Renderer, OnInit, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef, QueryList, HostListener } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent, NavInfo, Link } from '@app/models';
import * as imageUrl from '@app-lib/functions/image-url';
@Component({
	moduleId: module.id,
	selector: 'nav-item',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.css']
})

export class NavComponent implements OnInit, OnChanges, AfterViewInit{
	@Input() item: Item;
	@Input() mobilePageView: boolean = false; // true: mobile, false: default
	@Input() containerWidth: number = 1100;
	@Input() editable = false;
	@Input() editing = false;
  	@Input() selected = false;

	@Output('itemResize') itemResize = new EventEmitter<Box>();
	@Output('outLink') outLink = new EventEmitter<Link>();

	@ViewChild('linksContainer') public _linksContainer: ElementRef;
	@ViewChild('mobileMenu') public _mobileMenu: ElementRef;

	public _viewMobileMenu: boolean = false;
	public _viewSubNavList: number = -1;
	public _mobileLeft: number = 0;

  public _sub_view: number = -1;
	public _designType: string[] = ['|', '||', ''];
	public info: NavInfo = new NavInfo();
	public links: Link[] = [];

	public viewInited: boolean = false;

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer,
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer
	) { }

  ngOnInit() {
		let itemContent = (this.item.content as CommonItemContent<NavInfo>);
		this.info = itemContent.info.getDef(NavInfo.empty());
		this.item.content.box.left
		this._mobileLeft = itemContent.box.left - this.containerWidth;
	}

	ngOnChanges(changes: SimpleChanges) {
	if (changes['mobilePageView']) {
			this.setViewMode();
		}
		if (changes['selected'] && !changes['selected'].currentValue) {
			this._viewSubNavList = -1;
		}
  }

  ngAfterViewInit() {
		this.viewInited = true;
		this.setViewMode();
	}

	getDesignIcon(): string {
		let result = '';

		return result;
	}
	isImage(): boolean {
		if (this.info.imageInfo.image)
			return true;
		return false;
	}

	getImageURL(): SafeStyle {
		if (this.info.imageInfo.image)
			return this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(this.info.imageInfo.image));
		else
			return '';
	}

	hasSubLink(i: number): boolean {
		let result: boolean = false;
		this.info.links[i].sublinks.map(sublink=> {
			if (sublink.text.trim() != '') {
				result= true;
				return;
			}
		});
		return result;
	}

	dispSubNav(i: number, event: Event) {
		this._sub_view = i;
	}

	disableDispSubNav(event: Event) {
		this._sub_view = -1;
		this.changeDetector.detectChanges();
	}

	onHoverButton(i: number, event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement).parentElement, 'background-color', this.info.design.hoverColor);
		this._sub_view = i;
	}

	onLeaveButton(i: number, event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement).parentElement, 'background-color', this.info.design.backColor);
		this._sub_view = -1;
	}

	onSubLinkMouseOver(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	getBorderRadius(arrow: string): number {
		if (this.info.design[arrow])
			return this.info.design.amount;
		return 0;
	}

	getSpacing(w_h: string): string{
		if (w_h=='width') {
			return this.info.layout == 'side' ? '100%' : this.info.spacing + 'px';
		}
		else {
			return this.info.spacing + 'px';
			// return this.info.layout == 'top' ? this.item.content.box.height() + 'px' : this.info.spacing + 'px';
		}
	}

	onNavClick(i: number , j: number = -1) {
		if (!this.selected && this.editable) return;
		if (j == -1) {
			if (this.hasSubLink(i)) {
				if (this._viewSubNavList != i)
					this._viewSubNavList = i;
				else
					this._viewSubNavList = -1;
			}
			else {
				this._viewSubNavList = -1;
				if (!this.info.links[i].link) return;
				this._viewMobileMenu = false;
				if (this.editable) return;
				this.outLink.emit(this.info.links[i].link);
			}
		}
		else {
			this._viewSubNavList = -1;
			if (!this.info.links[i].sublinks[j].link) return;
			this._viewMobileMenu = false;
			if (this.editable) return;
			this.outLink.emit(this.info.links[i].sublinks[j].link);
		}
	}

	setViewMode() {
		if (!this.viewInited) return;
		if (this.mobilePageView) {
			setTimeout(() => {
				let ele = (this.elementRef.nativeElement as HTMLElement);
				let backEle = ele.getElementsByClassName('sitebackground');
				ele.style.display = 'block';
				this.resizeBox();
				if (backEle.length>0) {
					(backEle.item(0) as HTMLElement).style.width = '0px';
				}
			})
		}
		else {
			setTimeout(() => {
				let ele = (this.elementRef.nativeElement as HTMLElement);
				let backEle = ele.getElementsByClassName('sitebackground');
				ele.style.display = 'flex';
				this.resizeBox();
				if (backEle.length>0) {
					(backEle.item(0) as HTMLElement).style.width = '100%';
				}
			})
		}
	}

	resizeBox() {
		// if (this.info.layout=='top') {
		// 	$(this._linksContainer.nativeElement).css('height','100%');
		// }
		// else {
		// 	$(this._linksContainer.nativeElement).css('width','100%');
		// }
		const width = this.item.content.box.width();
		if (this._linksContainer) {
			const eleWidth = (this._linksContainer.nativeElement as HTMLElement).offsetWidth;
			if (width < eleWidth) {
				this.itemResize.emit(this.item.content.box.setRight(this.item.content.box.left + eleWidth));
			}
		}
	}

	onClickNavBarButton() {
		this._viewMobileMenu = !this._viewMobileMenu;
	}

	focusout(event) {
		this._viewSubNavList = -1;
	}

	@HostListener('window:resize', ['$event'])
	onWindowResize(event: UIEvent) {
		this.setViewMode();
	}
}
