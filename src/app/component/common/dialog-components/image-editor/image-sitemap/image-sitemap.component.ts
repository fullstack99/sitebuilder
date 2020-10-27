import {
	Component, OnInit, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as imageUrl from '@app-lib/functions/image-url';
import { Item, ImageItemContent, ImagePath, Page, Sitemap } from '@app/models';
import { SitemapService } from '@app/services' ;

@Component({
	moduleId: module.id,
	selector: 'image-sitemap',
	templateUrl: 'image-sitemap.component.html',
	styleUrls: ['image-sitemap.component.css']
})
export class ImageSitemapComponent implements OnInit, OnDestroy {
	@Output('placeOnPage') placeOnPage = new EventEmitter<ImagePath>();
	@Output('openInEditor') openInEditor = new EventEmitter<ImagePath>();
	@Output('close') close = new EventEmitter<void>();
	// ------------------------------------------------------------------------	
	public _loading: boolean = false;
	public _selectedPage: Page;   

	// ------------------------------------------------------------------------
	public sitemaps: Sitemap[] = [];
	public _orderedSitemaps: Sitemap[] = [];
	public pages: any = [];

	// ------------------------------------------------------------------------
	public _items: any;
	public _imageItems: any;
	public _sortedImageItems: any;	
		
	private time = new Date().getTime();
	private view_active: Boolean = true;
	private subs: Rx.Subscription[] = [];

	getcalcNum(page: Document): number {
		return this.pages.findIndex((p: any) => p == page);
	}

	constructor(
		private sitemapService: SitemapService,		
		private changeDetectorRef: ChangeDetectorRef,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit() {	   
		const init_sitemaps = this.sitemapService.getSitemaps(true, true);
		this.subs = [
			init_sitemaps.subscribe(
				sitemaps => {
					console.log(lodash.cloneDeep(sitemaps));
					this.sitemaps = sitemaps;
					this.orderBySitemaps(null);
					this._orderedSitemaps.forEach(sitemap => {
						this.pages = lodash.concat(this.pages, sitemap.pages);			
					});			
				},
				error => {
					console.log(error);
					this.refreshView();
				},
				() => { this.refreshView(); }
			)
		];
	}

	orderBySitemaps(uid: string | null) {
		let s = this.sitemaps.filter(sitemap => sitemap.parentUid == uid);
		this.sitemaps = this.sitemaps.filter(sitemap => sitemap.parentUid != uid);
		for (let i = 0; i < s.length; i++) {
			this._orderedSitemaps.push(s[i]);
			this.orderBySitemaps(s[i].uid);
		}
	}

	selectPage(uid: string) {
		console.log(uid);
		if (this._selectedPage && this._selectedPage.uid == uid) return;
		this.refreshView(true);
		this.sitemapService.getPage(uid).subscribe(
			res => {
				if (res) {
					this.setImageItems(res);
				}				
			},
			error => { this.refreshView(); },
			() => { this.refreshView(); }
		);
	}

	setImageItems(page: Page) {
		this._selectedPage = page;
		this._items = page.items;
		this._imageItems = this._items.filter((item: any) => item.content && item.itemType == 'ImageItem');
		this._sortedImageItems = lodash.sortedUniqBy(this._imageItems, (item: any) => item.content.image);
		
		this.refreshView();
	}

	onPlaceOnPage(item: any) {
		// let splitFileName = ('' + img.content.imgUrl.value).split('/');
		// let location = ('' + img.content.imgUrl.value).substr(0, img.content.imgUrl.value.lastIndexOf('/'));
		// let name = splitFileName[splitFileName.length - 1];
		// this.placeOnPage.emit({name: name, location: location});
		this.placeOnPage.emit(item.content.image);
	}

	onOpenInEditor(item: any) {
		this.openInEditor.emit(item.content.image);
	} 
		
	getBackground(item: Item): SafeStyle {
		const itemContent = item.content as ImageItemContent;
		const url = imageUrl.imageUrl(itemContent.image);
		if (url) {			
			return this.sanitizer.bypassSecurityTrustStyle(url);
		} else {
			return '';
		}		
	}

	getImageName(item: any) {
		return item.content.image.name;
	}

	onBackClick() {

	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		if (this.view_active)	   
			this.changeDetectorRef.detectChanges();	   
	}

	ngOnDestroy() {
		this.view_active = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
