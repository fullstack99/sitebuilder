import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, AfterViewChecked,
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Box } from '@app-lib/rect/rect';
import { Item, CommonItemContent, Sitemap, Tree, Link, LinkPage } from '@app/models';
import { AlertService, SitemapService, TreeService } from '@app/services' ;


@Component({
	moduleId: module.id,
	selector: 'sitemap-item',
	templateUrl: './sitemap-item.component.html',
	styleUrls: ['./sitemap-item.component.css']
})
export class SitemapItemComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {

	@Input() item: Item;
  	@Input() editable = false;
	@Input() selected = false;
	@Input() containerWidth = 1100;

	@Output() itemResize = new EventEmitter<Box>();
  	@Output() outLink = new EventEmitter<Link>();

  	@ViewChild('sitemapItemContainer') _sitemapItemContainer: ElementRef;

	public parent: HTMLElement;

	public _showSitemap = (s: Sitemap) => s.description;

	public tree: Tree<Sitemap>;
	public selectedTree: Tree<Sitemap>;
	public _sitemaps: Sitemap[] = [];

	private calledSitemapAPI = false;
	private subs: Subscription[] = [];
	private _viewInited = false;

	constructor(
		private elementRef: ElementRef,
		private changeDetectRef: ChangeDetectorRef,
		private alertService: AlertService,
		private sitemapService: SitemapService,
		private treeService: TreeService
	) {}

	ngOnInit() {
		this.parent = (this.elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		this.tree = this.treeService._trees['sitemap'];

		this.subs = [
		this.treeService._selectedTree.subscribe(res => {
			if (this.editable || !this._viewInited)
				return;

			if (!res) {
				this.selectedTree = res;
				this.treeService._currentTrees['sitemap'] = res;
				return;
			} else if (!res.value['pages']) {
				return;
			}
			this.selectedTree = res;
			this.treeService._currentTrees['sitemap'] = res;
			this.getListPages();
		})
		];
		this._viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {
	}

  	ngAfterViewInit() {

	}

	ngAfterViewChecked() {
		if (!this.tree && !this.calledSitemapAPI) {
			this.getSitemaps();
		} else {
			// setTimeout(() => {
			// 	this.setItemResize();
			// });
		}
	}

	setItemResize() {
		let changeable = false;
		const eleHeight = (this._sitemapItemContainer.nativeElement as HTMLElement).offsetHeight;
		const eleWidth = (this._sitemapItemContainer.nativeElement as HTMLElement).offsetHeight;

		const itemWidth = this.item.content.box.width();

		const itemHeight = this.item.content.box.height();

		if (itemHeight < eleHeight) {
			const box = this.item.content.box;
			if (eleHeight) {
				this.itemResize.emit(box.setBottom(box.top + eleHeight));
			}
		}
	}

	getSitemaps() {
		this.calledSitemapAPI = true;
		this.refreshView(true);
		this.sitemapService.getSitemaps().subscribe(
			res => {
				this._sitemaps = res;
				if (res.length > 0) {
					this.treeService._trees['sitemap'] =
							new Tree<Sitemap>(
								'sitemap',
								{ pages: [], parentUid: null, description: 'SITE MAP LISTING', siteId: 0, id: 1, uid: '', version: 1, expanded: true, type: 3 },
								Tree.buildTrees(
									'sitemap',
									this._sitemaps.filter(sitemap => sitemap.parentUid == null),
									sitemap => [sitemap, this._sitemaps.filter(subSitemap => subSitemap.parentUid == sitemap.uid)]));
					this.refreshView();
					this.tree = this.treeService._trees['sitemap'];
					this.setItemResize();
				} else {
					this.refreshView();
				}
			},
			error=> { console.log(error); this.refreshView(); },
			() => { }
		);
	}

	getListPages(skip: number = 0, take: number = 1) {
		this.sitemapService.getListPages(this.selectedTree.value.uid, '' + skip, '' + take, false).subscribe(
				res => {
					if (res && res.length > 0) {
						this.outLink.emit(new LinkPage(res[0].uid, this.selectedTree.value.uid));
					}
				},
				error => {},
				() => {}
			);
	}

	refreshView(loading: boolean = false) {
		this.changeDetectRef.detectChanges();
	}

	onMouseDown(e: MouseEvent) {
		if (!this.editable) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	ngOnDestroy() {
      	this.subs.forEach(s => s.unsubscribe());
	}
}

