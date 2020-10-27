import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChildren, ElementRef, HostListener, Input,
	QueryList, AfterViewInit, Renderer, ChangeDetectionStrategy
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { updateArrayAt, moveArrayElements, padArray, withArray, removeArrayElem } from '@app-lib/array/array';
import { Box } from '@app-lib/rect/rect';
import { Maybe } from '@app-lib/maybe/maybe';

import * as imageUrl from '@app-lib/functions/image-url';

import { CommonItemContent, ImageInfo, DesignInfo, NavLink, NavInfo, NavLayout } from '@app/models';
import { WSService, SitemapService } from '@app/services';
import { AppService } from '@app/app.service';
import { environment } from "@app-environments/environment";

@Component({
    moduleId: module.id,
    selector: 'navigation-theme',
	  templateUrl: './navigation-theme.component.html',
    styleUrls: [
		'../navigation-dialog.component.css',
		'./navigation-theme.component.css'
    ]
})
export class NavigationThemeComponent implements OnInit, OnDestroy, AfterViewInit {

  @Output() selectedTheme = new EventEmitter<CommonItemContent<NavInfo>>();

  public _linkWidth = 125;
  public _linkHeight = 50;

  public _linkDragStart = new Rx.Subject<[number, number]>();
	public _linkDragEnd = new Rx.Subject<[number, number]>();
	public _linkDrag = new Rx.Subject<[number, number, number]>();
	public _linkIndexChange = new Rx.Subject<[number, number[]]>();

  public _themes: CommonItemContent<NavInfo>[] = [];
  loading: boolean = false;
  private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
    private elementRef: ElementRef,
    private renderer: Renderer,
    private sanitizer: DomSanitizer,
    private wsService: WSService,
    private appService: AppService
	) { }

	ngOnInit() {
    this.createThemes();
    this.getThemes();
		this.subs = [
        Rx.Observable.merge(
                this._linkDragStart,
                this._linkDragEnd,
                this._linkDrag
            )
            .subscribe(() => {
                this.changeDetector.detectChanges();
            }),

        this._linkIndexChange.subscribe((result) => {
            this._themes[result[0]].info.value.links = withArray(this._themes[result[0]].info.value.links, ar=>
                result[1].forEach((di: number, i: number) => {
                      console.log(di,i);
                      ar[i + di] = this._themes[result[0]].info.value.links[i];
            }));
            this.changeDetector.detectChanges();
        })
		];
	}

	ngAfterViewInit() {
  }

  createThemes() {
		let navInfo: NavInfo = NavInfo.empty();
		navInfo.links = [new NavLink(), new NavLink(), new NavLink(), new NavLink()];

		this._themes = [
			new CommonItemContent<NavInfo>(Maybe.just(navInfo)).setMBox(new Box(280, 315, 10, 35))
		];
  }

  getThemes() {
    this.refreshView(true);
    this.wsService.getCategories(null, environment.NAVLibrary)
      .pipe()
      .subscribe(
        (res: any) => {
          res.forEach(sc=> {
            this.getThemePages(sc.uid);
          })
        },
        error => {
          this.refreshView(false);
        },
        () => {}
      );
  }

  getThemePages(uid: string) {
    this.wsService.getThemePage(uid, 0, 100, '0', true, true, environment.NAVLibrary)
      .pipe()
      .subscribe(
        (res: any) => {
          if (res && res.data) {
            res.data.forEach(r=> {
              let navItems = r.items.filter(i=>i.itemType == 'NavItem');
              navItems.forEach(ni => {
                let temp = this.appService.createItem(ni);
                this._themes.push(temp.content as CommonItemContent<NavInfo>);
              })
            });
          }
          this.refreshView();
        },
        error => {
          this.refreshView();
        })
  }

  selectTheme(event: MouseEvent, theme) {
		event.stopPropagation();
		event.preventDefault();
    this.selectedTheme.emit(theme);
  }

  hasSubLink(theme, i: number): boolean {
		let result: boolean = false;
		theme.info.value.links[i].sublinks.map(sublink=> {
			if (sublink.text.trim() != '') {
				result= true;
				return;
			}
		});
		return result;
	}

  getImageURL(theme): SafeStyle {
		if (theme.info.value.imageInfo.image)
			return this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(theme.info.value.imageInfo.image));
		else
			return '';
  }

  getSpacing(w_h: string, theme): string{
		if (w_h=='width') {
			return theme.info.value.layout == 'side' ? '100%' : theme.info.value.spacing + 'px';
		}
		else {
			return theme.info.value.spacing + 'px';
			// return this.info.layout == 'top' ? this.item.content.box.height() + 'px' : this.info.spacing + 'px';
		}
  }

  getBorderRadius(arrow: string, i: number = 0): number {
      if (this._themes[i].info.value.design[arrow])
          return this._themes[i].info.value.design.amount;
	  	return 0;
  }

  onHoverButton(theme, i: number, event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement).parentElement, 'background-color', theme.info.value.design.hoverColor);
		// this._sub_view = i;
	}

	onLeaveButton(theme, i: number, event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement).parentElement, 'background-color', theme.info.value.design.backColor);
		// this._sub_view = -1;
  }

  onNavClick(i) {

  }

  onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
  }

  refreshView(loading: boolean = false, text: string = 'Loading...') {
    this.loading = loading;
    this.changeDetector.detectChanges();
  }

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
