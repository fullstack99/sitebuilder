import { Directive, Input, Output, HostListener, OnDestroy, EventEmitter,
		 Renderer, ElementRef, OnChanges, SimpleChanges,
		 Injector, ComponentRef, OnInit, ComponentFactoryResolver, Inject
	   } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/pairwise';
import * as lodash from 'lodash';

import { Maybe } from '@app-lib/maybe/maybe';
import { ancestors, elementRectPage } from '@app-lib/dom/dom';
import { MenuComponent } from '@app-directives/context-menu/menu.component';
import { ContextMenu } from '@app/models';

export { ContextMenu, SimpleMenuItem, InputMenuItem, MenuItemCssIcon,
		 MenuItemImageIcon, DoubleMenuItem, SubMenuItem } from '@app/models';

const directiveInstances: ContextMenuDirective<any>[] = [];

function destroyAllMenus() {
	directiveInstances.forEach(d => d.destroyMenu());
}

@Directive({
	selector: '[context-menu]'
})
export class ContextMenuDirective<T> implements OnDestroy, OnInit, OnChanges {
	@Input('context-menu-enabled') enabled = false;
	@Input('context-menu-left-enabled') left_enabled = false;
	@Input('context-menu') menu: ContextMenu<T> = [];
	@Input('context-active-menu') active_menu: string = '';
	@Input('context-more-menu') more_menu: boolean = false;
	@Input('context-menu-pageX') pageX: number = 0;
	@Input('context-menu-pageY') pageY: number = 0;
	@Input('extraLeft') extraLeft: number = 0;
	@Input('extraTop') extraTop: number = 0;

	@Output('context-menu-shown'  ) menuShown = new EventEmitter<void>();
	@Output('context-menu-disappear') menuDisappear = new EventEmitter<void>();
	@Output('context-menu-command') menuCommand = new EventEmitter<T>();

	public menuItem_height: number = 34;
	public _menuContainer = Maybe.nothing<HTMLElement>();
	public _menuComponent: any = Maybe.nothing<ComponentRef<MenuComponent<T>>>();

	public _command = new Rx.Subject<T>();
	public _previewCommand = new Rx.Subject<T>();

	public _menuComponentSubs: Rx.Subscription[] = [];

	public _subs: Rx.Subscription[] = [];

	constructor(
		public _renderer  : Renderer,
		public _elementRef: ElementRef,
		public _resolver  : ComponentFactoryResolver,
		public _injector  : Injector,
		@Inject(DOCUMENT) public document: Document
	) {}

	ngOnInit() {
		directiveInstances.push(this);
		this._subs = [
			this._command.subscribe(c => {
				if (c)
					this.menuCommand.emit(c);
				this.destroyMenu();
			}),
			this._previewCommand.subscribe(c => this.menuCommand.emit(c)),
		];
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['more_menu'] && changes['more_menu'].currentValue) {
			const ele = this._elementRef.nativeElement as HTMLElement;
			const rect = elementRectPage(this._elementRef.nativeElement);
			this.createMenu(rect.left + ele.offsetWidth - 210, rect.top + ele.parentElement.scrollTop + this.document.body.scrollTop);
		}
		if (changes['left_enabled'] && changes['left_enabled'].currentValue) {
			this.createContectMenu(null, this.pageX, this.pageY);
		}
	}

	createMenu(left: number, top: number) {
		const factory = this._resolver.resolveComponentFactory(MenuComponent);
		this._menuContainer = Maybe.just(this._renderer.createElement(this.document.documentElement, 'div'));
		this._menuContainer.map(elem => {
			this._renderer.setElementStyle(elem, 'position', 'fixed');
			this._renderer.setElementStyle(elem, 'left', `${left}px`);
			this._renderer.setElementStyle(elem, 'top' , `${top}px`);

			this._menuComponent = Maybe.just(factory.create(this._injector, [], elem));
			this._menuComponent.map(mc => {
				mc.instance.menu = this.menu;
				mc.instance.active_menu = this.active_menu;
				mc.instance.main = true;
				mc.instance.parent_width = (this._elementRef.nativeElement as HTMLElement).offsetWidth;
				this._menuComponentSubs = [
					mc.instance.command.subscribe(this._command),
					mc.instance.previewCommand.subscribe(this._previewCommand)
				];

				mc.changeDetectorRef.detectChanges();

				mc.onDestroy(() => {
					mc.changeDetectorRef.detach();
				});
			});
		});
	}

	destroyMenu() {
		this._menuComponent.map(mc => {
			this._menuComponentSubs.forEach(s => s.unsubscribe());
			this._menuComponentSubs = [];

			mc.destroy();
			this._menuComponent = Maybe.nothing<ComponentRef<MenuComponent<T>>>();
		});
		this._menuContainer.map(elem => {
			if (elem.parentNode) { elem.parentNode.removeChild(elem); }
			this._menuContainer = Maybe.nothing<HTMLElement>();
		});
	}

	createContectMenu(event: MouseEvent, pageX: number, pageY: number) {

		if (!this.enabled) { return; }
		destroyAllMenus();
		if (!this.menu || this.menu.length === 0) { return; }
		if (event) event.preventDefault();

		const menu_height = this.menu.length * this.menuItem_height;
		const menu_width = 205;
		const extra_height = 50;
		const rect = elementRectPage(this._elementRef.nativeElement);
		const parent_rect = elementRectPage((this._elementRef.nativeElement as HTMLElement).parentElement);
		//let top = (parent_rect.top + parent_rect.height - event.pageY - extra_height) > menu_height ? event.pageY - rect.top - this.document.body.scrollTop : lodash.max([0,event.pageY - rect.top - this.document.body.scrollTop - menu_height - extra_height]);
		// let left = (this.left_enabled) ? (event.pageX - rect.left) / 2 : (parent_rect.width - (event.pageX - rect.left) > menu_width ? event.pageX - rect.left : event.pageX - rect.left - menu_width);
		let top = (parent_rect.top + parent_rect.height - pageY - extra_height) > menu_height ? pageY - this.extraTop - this.document.body.scrollTop : lodash.max([rect.top - this.extraTop, pageY - this.extraTop - this.document.body.scrollTop - menu_height - extra_height]);
		let left = (parent_rect.width - (pageX - rect.left) > menu_width ? pageX - this.extraLeft : pageX - this.extraLeft - menu_width);
		// let left = (this.left_enabled) ? pageX - 210 : (parent_rect.width - (pageX - rect.left) > menu_width ? pageX - this.extraLeft : pageX - this.extraLeft - menu_width);

		this.createMenu(left, top);
		this.menuShown.emit();
	}

	@HostListener('contextmenu', ['$event'])
	onContextMenu(event: MouseEvent) {
		this.createContectMenu(event, event.pageX, event.pageY);
	}

	@HostListener('window:mousedown', ['$event'])
	@HostListener('mousedown', ['$event'])
	onWindowClick(event: MouseEvent) {
		if (!ancestors(event.target as HTMLElement).some(el => el === this._menuContainer.value)) {
			// Clicked outside of the menu.
			destroyAllMenus();
			// this.destroyMenu();
			this.menuDisappear.emit();
		}
	}

	ngOnDestroy() {
		this.destroyMenu();

		this._subs.forEach(s => s.unsubscribe());
		this._subs = [];

		const i = directiveInstances.indexOf(this);
		directiveInstances.splice(i, 1);
	}
}
