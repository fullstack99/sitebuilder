import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild,
	ViewChildren, ElementRef, HostListener, Input, QueryList, AfterViewInit, Renderer,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { lazy, Lazy } from '@app-lib/rx/rx';
import { ancestors, elementOffsetRect } from '@app-lib/dom/dom';
import { updateArrayAt, moveArrayElements, padArray, withArray, removeArrayElem } from '@app-lib/array/array';
import { Maybe } from '@app-lib/maybe/maybe';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { History } from '@app-lib/history/history';
import { createLinkingDialogWindow, LinkingForm, LinkFormData, Link, LinkSource } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { DesignDialogComponent, createDesignDialogWindow } from '@app-dialogs/design-dialog/design-dialog.component';
import { ImageDialogComponent, createImageDialogWindow } from '@app-dialogs/image-dialog/image-dialog.component';
import { CommonItemContent, ImageInfo, DesignInfo, NavLink, NavInfo, NavLayout } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { ImageInfo, DesignInfo, NavLink, NavInfo, NavLayout} from '@app/models';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createNavigationDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<NavInfo>
): DialogWindow<NavigationDialogComponent> {
	return windowService.create<NavigationDialogComponent>(
		NavigationDialogComponent,
		{
			width: 950,
			height: 620,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = itemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

class AllNavLinks { }
class SelectedNavLink { constructor(public i: number) {} }
class SelectedSubNavLink { constructor(public i: number, public j: number) {} }
class AddNavLink { constructor(public navLink: NavLink) {} }
class AddSubNavLink { constructor(public i: number) {} }
class RemoveNavLink { constructor(public i: number) {} }
class RemoveSubNavLink { constructor(public i: number, public j: number) {} }
class UpdateNavLink { constructor(public readonly navLink: NavLink, public newNavLink: NavLink) {} }

class NavLinkIndexChange { constructor(public i: number[]) {}}
class SubNavLinkIndexChange { constructor(public i: number[]) {}}

class Layout { constructor(public layout: NavLayout) { } }
class Design { constructor(public design: DesignInfo) {}}
class Image { constructor(public image: ImageInfo) {} }
class Spacing { constructor(public space: number) {} }

class FontStyle { constructor(public i: number, public f: any) {} }
class SubFontStyle { constructor(public i: number, public j: number, public f: any) {} }
class SubDisp { constructor(public disp: number) { } }

class SetLinking { constructor(public i: number, public link: Link) {} }
class SetSubLinking { constructor(public i: number, public j: number, public link: Link) {} }

class Undo { }
class Redo { }

class EmptyCommand { }

class State {
	constructor(
		public selectedNavLink: number = -1,
		public selectedSubNavLink: number[] = [-1,-1],
		public navLinks: NavLink[] = [],
		public navFontStyle: any = {fontSize: '14px', fontFamily: '', bold: false, italic: false, underline: false, color: 'black', backgroundColor: 'white'},
		public subNavFontStyle: any = {fontSize: '14px', fontFamily: '', bold: false, italic: false, underline: false, color: 'black', backgroundColor: 'white'},
		public subdisp: number = -1,
		public spacing: number = 25,
		public layout: NavLayout = 'top',
		public design: Design = new Design(DesignInfo.empty()),
		public image: Image = new Image(ImageInfo.empty())
	) {}
}

type Command =
	AllNavLinks
	| SelectedNavLink
	| AddNavLink
	| AddSubNavLink
	| RemoveNavLink
	| RemoveSubNavLink

	| NavLayout
	| FontStyle
	| SubFontStyle
	| SubDisp
	| Spacing

	| SetLinking
	| SetSubLinking

	| Design
	| Image
	| Undo
	| Redo;

// Hotkeys
// ----------------------------------------------------------------
type ModKeys = 'ctrl';

const MOD_KEY_SELECTORS: { [k: string]: (e: MouseEvent | KeyboardEvent) => boolean } = {
	ctrl: (e: MouseEvent) => e.ctrlKey
};

const MOD_KEYS = {
	addOrRemoveFromSelection: 'ctrl'
};

interface CommandHotkey {
	key: string;
	modKeys: string[];
}

const COMMAND_HOTKEYS = {
	removeItems: [{ key: 'Delete', modKeys: [] as string[] },
	{ key: 'Del', modKeys: [] as string[] }],
	undo: [{ key: 'z', modKeys: ['ctrl'] },
	{ key: 'Z', modKeys: ['ctrl'] }],
	redo: [{ key: 'y', modKeys: ['ctrl'] },
	{ key: 'Y', modKeys: ['ctrl'] }]
};

function checkCommandHotkey(hotkeys: CommandHotkey[], event: KeyboardEvent) {
	if (hotkeys.some(hotkey =>
		hotkey.key === event.key
		&& hotkey.modKeys.every(modKey => MOD_KEY_SELECTORS[modKey](event)))
	) {
		event.preventDefault();
		return true;
	} else {
		return false;
	}
}

// ----------------------------------------------------------------
// History & state
// ----------------------------------------------------------------
class HistoryEntry<C, S> {
	constructor(
		public command: C,
		public state: S
	) { }
}

const HISTORY_LENGTH = 20;

/** Don't save these commands in history. */
const DROP_FROM_HISTORY: Command[] = [
	Undo, Redo, SubDisp, SelectedNavLink, SelectedSubNavLink
];
// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: './navigation-dialog.component.html',
	styleUrls: ['./navigation-dialog.component.css']
})
export class NavigationDialogComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input('itemContent') itemContent: CommonItemContent<NavInfo> = new CommonItemContent<NavInfo>(Maybe.just(NavInfo.empty()));
	@Input('isEdit') isEdit: Boolean = false;

	@Output('submit') submit = new EventEmitter<CommonItemContent<NavInfo>>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChildren('navlink') public _navlinkElems: QueryList<ElementRef>;
	@ViewChildren('subNavlink') public _subNavlinkElems: QueryList<ElementRef>;
	@ViewChildren('navText') public _navTextElems: QueryList<ElementRef>;
	@ViewChildren('subNavText') public _subNavTextElems: QueryList<ElementRef>;

	@ViewChild('textTool') public _textTool: ElementRef;
	@ViewChild('canvasContainer') public _canvasContainer: ElementRef;
	@ViewChild('linksContainer') public _linksContainer: ElementRef;

	public designInfo: DesignInfo = DesignInfo.empty();

	public _top = 50;
	public _left = 10;
	public _linkWidth = 115;
	public _linkHeight = 30;
	public _imageMarginTop = 0;
	public _selectedElem: HTMLElement = null;
	public _link: Link = null;
	public _fontStyle: any = {fontSize: '14px', fontFamily: 'Arial', bold: false, italic: false, underline: false, color: 'black', backgroundColor: 'white'};

	// ---------------------------------------------------------------
	public _removeLinkAt = new Rx.Subject<number>();

	public _startEditLinkAt = new Rx.Subject<number>();
	public _stopEditLink = new Rx.Subject<void>();

	public _startSubEditLinkAt = new Rx.Subject<[number,number]>();
	public _stopSubEditLink = new Rx.Subject<void>();

	public _navLinkDragStart = new Rx.Subject<number>();
	public _navLinkDragEnd = new Rx.Subject<number>();
	public _navLinkDrag = new Rx.Subject<[number, number]>();
	public _navLinkIndexChange = new Rx.Subject<number[]>();

	public _subNavLinkDragStart = new Rx.Subject<number>();
	public _subNavLinkDragEnd = new Rx.Subject<number>();
	public _subNavLinkDrag = new Rx.Subject<[number, number]>();
	public _subNavLinkIndexChange = new Rx.Subject<number[]>();

	public dragging: boolean = false;
	public viewInited: boolean = false;

	// ---------------------------------------------------------------
	public _minSpacing = 0;
	public _maxSpacing = 100;
	public _layout = new FormControl('top');
	public _spacing = new FormControl(25);

	// ---------------------------------------------------------------
	public _clearState = new Rx.Subject<EmptyCommand>();

	public _addNavLink = new Rx.Subject<NavLink>();
	public _addSubNavLink = new Rx.Subject<number>();
	public _removeNavLink = new Rx.Subject<number>();
	public _removeSubNavLink = new Rx.Subject<[number, number]>();

	public _setLink = new Rx.Subject<[number, Link]>();
	public _setSubLink = new Rx.Subject<[number, number, Link]>();

	public _navLayout = new Rx.Subject<Layout>();
	public _navFontStyle = new Rx.Subject<FontStyle>();
	public _navSubFontStyle = new Rx.Subject<SubFontStyle>();
	public _navSpacing = new Rx.Subject<Spacing>();
	public _navSubdisp = new Rx.Subject<SubDisp>();
	public _navDesign = new Rx.Subject<Design>();
	public _navImage = new Rx.Subject<Image>();
	public _undo = new Rx.Subject<void>();
	public _redo = new Rx.Subject<void>();
	public _keyboardEvent = new Rx.Subject<KeyboardEvent>();

	public currentState: State = new State();
	private currentCommand: any;

	private history: Lazy<Rx.Observable<History<HistoryEntry<Command, State>>>>;
	private newHistoryEntry: Rx.Observable<HistoryEntry<AllNavLinks, State>>;

	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private sanitizer: DomSanitizer,
		private renderer: Renderer,
		private windowService: WindowService
	) { }

	get _spacingValue(): number { return Math.round(this._spacing.value); }

	ngOnInit() {
		let navInfo = this.itemContent.info.value;
		if (!lodash.isEqual(NavInfo.empty(),navInfo))
			this.isEdit = true;

		this.currentState = new State(-1,[-1,-1],navInfo.links,navInfo.fontStyle,navInfo.subFontStyle,-1,navInfo.spacing,navInfo.layout,new Design(navInfo.design), new Image(navInfo.imageInfo));
		const initialHistoryEntry = new HistoryEntry<Command, State>(new EmptyCommand(), this.currentState);
		const initialHistory = new History(initialHistoryEntry, [], [], HISTORY_LENGTH);
		this._spacing.setValue(this.currentState.spacing,{emitEvent: false});
		this._layout.setValue(this.currentState.layout,{emitEvent: false});

		const undo = this._undo
			.merge(this._keyboardEvent
				.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.undo, e)))
			.map(() => new Undo)
			.publish().refCount();

		const redo = this._redo
			.merge(this._keyboardEvent
				.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.redo, e)))
			.map(() => new Redo)
			.publish().refCount();

		const removeLink = Rx.Observable
			.merge(
			this._keyboardEvent
				.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.removeItems, e))
				.map(_e => new RemoveNavLink(this.currentState.selectedNavLink)),
			this._removeNavLink.map(i => new RemoveNavLink(i)))
			.publish().refCount();

		const removeSubLink = this._removeSubNavLink.map(v => new RemoveSubNavLink(v[0], v[1]));

		const editingNavLinkIndex = Rx.Observable.merge(
			this._startEditLinkAt.map(i => i),
			this._stopEditLink.map(() => -1)
		).publish().refCount();

		const subEditingLinkIndex = Rx.Observable.merge(
			this._startSubEditLinkAt.map(value => value),
			this._stopSubEditLink.map(() => [-1,-1])
		).publish().refCount();

		const stateCommands = Rx.Observable.merge(
			this._clearState,
			this._addNavLink.map(navLink => new AddNavLink(navLink)),
			this._addSubNavLink.map((i) => new AddSubNavLink(i)),
			removeLink,
			removeSubLink,
			editingNavLinkIndex.map(n => new SelectedNavLink(n)),
			subEditingLinkIndex.map(n => new SelectedSubNavLink(n[0], n[1])),
			this._navLinkIndexChange.map(obj => new NavLinkIndexChange(obj)),
			this._subNavLinkIndexChange.map(obj => new SubNavLinkIndexChange(obj)),

			this._setLink.map(obj => new SetLinking(obj[0],obj[1])),
			this._setSubLink.map(obj => new SetSubLinking(obj[0],obj[1],obj[2])),
			this._navLayout,
			this._navSpacing,
			this._navSubdisp,
			this._navDesign,
			this._navImage,
			this._navFontStyle,
			this._navSubFontStyle
		).publish().refCount();

		this.newHistoryEntry = stateCommands
			.map(command =>
				new HistoryEntry(
					command,
					this.updateState(this.currentState, command)))
			.publish().refCount();

		this.history = new Lazy(() =>
			this.newHistoryEntry
				.merge(undo)
				.merge(redo)
				.scan<any, History<HistoryEntry<Command, State>>>((history, x) =>
					x instanceof HistoryEntry
						? DROP_FROM_HISTORY.some(c => x.command instanceof <any>c)
							? history.modifyCurrentState(
								new HistoryEntry(history.current.command, x.state))
							: history.push(x)
						: x instanceof Undo
							? history.undo()
							: history.redo(),
				initialHistory));

		this.newHistoryEntry = stateCommands
			.map(command =>
				new HistoryEntry(
					command,
					this.updateState(this.currentState, command)))
			.publish().refCount();

		this.subs = [
			Rx.Observable.merge(
				this._navLinkDragEnd,
				this._navLinkDrag,
				this._subNavLinkDragEnd,
				this._subNavLinkDrag,
				this._navLinkIndexChange,
				this._subNavLinkIndexChange
			).subscribe(() => {
				this.refreshView();
			}),

			Rx.Observable.merge(
				this._navLinkDragStart,
				this._subNavLinkDragStart
			).subscribe(() => {
				this.dragging = true; this.refreshView();
			}),

			stateCommands.subscribe(command=> {
				this.currentCommand = command;
			}),

			this._layout.valueChanges.subscribe(result => {
				if (this._layout.value != this.currentState.layout)
					this._navLayout.next(new Layout(this._layout.value));
			}),
			this._spacing.valueChanges.subscribe(result => {
				if (this._spacingValue != this.currentState.spacing)
					this._navSpacing.next(new Spacing(this._spacingValue));
			}),

			this.history.value.subscribe(r=> {
				this.currentState = r.current.state;
				let state = this.currentState;

				if (this._spacingValue != state.spacing)
					this._spacing.setValue(state.spacing,{emitEvent: false});
				if (this._layout.value != state.layout)
					this._layout.setValue(state.layout,{emitEvent: false});
				if (state.selectedNavLink >= 0) {
					this._fontStyle = state.navFontStyle;
					this._link = state.navLinks[state.selectedNavLink].link;
				} else if (state.selectedSubNavLink[0] >= 0) {
					this._fontStyle = state.subNavFontStyle;
					this._link = state.navLinks[state.selectedSubNavLink[0]].sublinks[state.selectedSubNavLink[1]].link;
				}
				this._imageMarginTop = this._layout.value == 'side' ? 0 : this._navTextElems.toArray()[0] ? (this._navTextElems.toArray()[0].nativeElement.offsetHeight > this.currentState.image.image.size ? this._navTextElems.toArray()[0].nativeElement.offsetHeight - this.currentState.image.image.size : (this._navTextElems.toArray()[0].nativeElement.offsetHeight - this.currentState.image.image.size)/2) : 0;
				if (r.current.command instanceof NavLinkIndexChange || r.current.command instanceof SubNavLinkIndexChange) {
					setTimeout(() => {
						this.dragging = false;
					})
				}
				this.refreshView();
			})
		];
	}

	ngAfterViewInit() {
		this.viewInited = true;
		(this._textTool.nativeElement as HTMLElement).style.display = 'none';
	}

	updateState(state: State, command: Command): State {
		let newState = new State(state.selectedNavLink, state.selectedSubNavLink, state.navLinks, state.navFontStyle, state.subNavFontStyle, state.subdisp, state.spacing, state.layout, state.design, state.image);
		const updateLink = (link: NavLink, updater: (link: NavLink) => NavLink) => {
			const newLink = updater(link);
			newState.navLinks = newState.navLinks.map(i => i !== link ? i : newLink);
		};

		if (command instanceof EmptyCommand) {
      		const navInfo = this.itemContent.info.value;
      		newState = new State(-1, [-1, -1], navInfo.links, navInfo.fontStyle, navInfo.subFontStyle, -1, navInfo.spacing, navInfo.layout, new Design(navInfo.design), new Image(navInfo.imageInfo));
		} else if (command instanceof SelectedNavLink) {
			newState.selectedNavLink = command.i;
			newState.selectedSubNavLink = [-1, -1];
			newState.subdisp = -1;
		} else if (command instanceof SelectedSubNavLink) {
			newState.selectedNavLink = -1;
			newState.selectedSubNavLink = [command.i, command.j];
		} else if (command instanceof Spacing) {
			newState.spacing = command.space;
		} else if (command instanceof SubDisp) {
			newState.selectedNavLink = -1;
			newState.subdisp = command.disp;
		} else if (command instanceof FontStyle) {
			newState.subdisp = -1;
			newState.navFontStyle = command.f;
		} else if (command instanceof SubFontStyle) {
			newState.subNavFontStyle = command.f;
		} else if (command instanceof Layout) {
			newState.layout = command.layout;
		} else if (command instanceof AddNavLink) {
			newState.navLinks = [...newState.navLinks, command.navLink];
			newState.selectedNavLink = -1;
			newState.subdisp = -1;
		} else if (command instanceof RemoveNavLink) {
			newState.subdisp = -1;
			newState.navLinks = removeArrayElem(newState.navLinks, command.i);
		} else if (command instanceof NavLinkIndexChange) {
			newState.navLinks = withArray(newState.navLinks, ar =>
				command.i.forEach((di: number, i: number) => {
					ar[i + di] = newState.navLinks[i];
				}));
		} else if (command instanceof SubNavLinkIndexChange) {
			let currentNavLink = newState.navLinks[newState.subdisp];
			if (currentNavLink) {
				currentNavLink.sublinks = withArray(currentNavLink.sublinks, ar =>
					command.i.forEach((di: number, i: number) => {
						let temp = i + di;
						if (temp >= currentNavLink.sublinks.length) temp = currentNavLink.sublinks.length - 1;
						ar[temp] = currentNavLink.sublinks[i];
					}));
			}
		} else if (command instanceof  Design) {
			newState.design = command;
		} else if (command instanceof Image) {
			newState.image = command;
		} else if (command instanceof AddSubNavLink) {
			let newNavLink = new NavLink();
			let navLink = newState.navLinks[command.i];
			newState.navLinks[command.i].sublinks = [...navLink.sublinks, newNavLink];
		} else if (command instanceof RemoveSubNavLink) {
			let navLink = newState.navLinks[command.i];
			newState.navLinks[command.i].sublinks = removeArrayElem(navLink.sublinks, command.j);
		} else if (command instanceof SetLinking ) {
			newState.subdisp = -1;
			newState.navLinks = updateArrayAt(newState.navLinks, command.i, x => x!.setLink(command.link));
		} else if (command instanceof SetSubLinking) {
			let subLinks = updateArrayAt(newState.navLinks[command.i].sublinks, command.j, x => x!.setLink(command.link));
			let link = newState.navLinks[command.i].setSublinks(subLinks);
			newState.navLinks = updateArrayAt(newState.navLinks, command.i, x => link);
		}
		return newState;
	}

	removeNavLinkAt(i: number, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this._stopEditLink.next();
		// this._stopSubEditLink.next();
		this._removeNavLink.next(i);
	}

	addSubNavLink(i: number, event: MouseEvent) {
		if (this.dragging) return;
		event.stopPropagation();
		event.preventDefault();
		this._stopSubEditLink.next();
		this._addSubNavLink.next(i);
	}

	stopEditing(event: MouseEvent) {
		if (this.dragging) return;
		event.stopPropagation();
		event.preventDefault();
		this._stopEditLink.next();
		(this._textTool.nativeElement as HTMLElement).style.display = 'none';
	}

	startEditingLinkAt(n: number, event: MouseEvent) {
		if (event) {
			this._selectedElem = event.target as HTMLElement;
			event.stopPropagation();
			event.preventDefault();
		}
		if (this.currentState.selectedNavLink != n) {
			this._startEditLinkAt.next(n);
			let linkEle = this._navlinkElems.toArray()[n].nativeElement as HTMLElement;
			this.setTextToolPosition(linkEle);
		}
		setTimeout(() => {
			let navTextEle = this._navTextElems.toArray()[n].nativeElement as HTMLElement;
			navTextEle.focus();
		}, 100);
	}

	dispSubList(i: number, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this._navSubdisp.next(new SubDisp(i));
	}

	addNavLink(event: MouseEvent) {
		event.stopPropagation();
		this._stopEditLink.next();
		this._addNavLink.next(new NavLink());
		if (this.currentState.layout == 'top')
			(this._canvasContainer.nativeElement as HTMLElement).scrollLeft = (this._canvasContainer.nativeElement as HTMLElement).scrollLeft + 160;
		else
			(this._canvasContainer.nativeElement as HTMLElement).scrollTop = (this._canvasContainer.nativeElement as HTMLElement).scrollTop + 60;
	}

	hasSubLink(i: number): boolean {
		const state = this.currentState;
		if (lodash.findIndex(state.navLinks[i].sublinks,((sublink) => sublink.text.trim() != '')) > -1) return true;
		return false;
	}

	subStartEditingLinkAt(i: number, j: number, event: MouseEvent) {
		if (event) {
			this._selectedElem = event.target as HTMLElement;
			event.stopPropagation();
			event.preventDefault();
		}
		if (this.currentState.selectedSubNavLink[0] != i || this.currentState.selectedSubNavLink[1] != j) {
			this._startSubEditLinkAt.next([i, j]);
			const linkEle = this._navlinkElems.toArray()[i].nativeElement as HTMLElement;
			this.setTextToolPosition(linkEle);
		}
		setTimeout(() => {
			const eles = event.srcElement['parentElement'].getElementsByClassName('subTextEditor');
			(eles[0] as HTMLElement).focus();
		}, 100);
	}

	subEnable(i: number, j: number) {
		let state = this.currentState;
		if (state.selectedSubNavLink[0] == i && state.selectedSubNavLink[1] == j)
			return true;
		return false;
	}

	removingSubLinkAt(i: number, j: number, event: MouseEvent) {
		event.stopPropagation();
		this._removeSubNavLink.next([i, j]);
	}

	checkEmpty(text: string) {
		return text.trim() == '' ? true : false;
	}

	isImage(): boolean {
		if (this.currentState && this.currentState.image.image.image)
			return true;
		return false;
	}

	isActive(button:string): boolean {
		let state = this.currentState;
		switch (button) {
			case 'design':
				return differenceDeep.isDifference(state.design.design, DesignInfo.empty());
			case 'image':
				return !state.image.image.image ? false : true;
			case 'change':
				return (lodash.findIndex(state.navLinks,((navLink) =>navLink && navLink.text.trim() != ''))>-1) ? true : false;
			case 'link':
				let selectedNavLink = this.currentState.selectedNavLink;
				let subEditingLink = this.currentState.selectedSubNavLink;

				if (selectedNavLink > -1) {
					if (this.currentState.navLinks[selectedNavLink].link) {
						return true;
					} else {
						return false;
					}
				} else if (subEditingLink[0] > -1 && subEditingLink[1] > -1) {
					if (this.currentState.navLinks[subEditingLink[0]].sublinks[subEditingLink[1]].link) {
						return true;
					} else {
						return false;
					}
				}
		}
		return false;
	}

	getSpacing(w_h: string): string{
		if (w_h=='width') {
			return this._layout.value == 'side' ? '100%' : this._spacing.value + 'px';
		}
		else {
			return this._layout.value == 'top' ? this._spacing.value : this._spacing.value + 'px';
		}
	}

	getBorderRadius(arrow: string): number {
		if (this.currentState && this.currentState.design.design[arrow])
			return this.currentState.design.design.amount;
		return 0;
	}

	onHoverButton(event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement), 'background-color', this.currentState.design.design.hoverColor);
	}

	onLeaveButton(event: Event) {
		let target = event.target || event.srcElement;
		this.renderer.setElementStyle((target as HTMLElement), 'background-color', this.currentState.design.design.backColor);
	}

	getImageURL(): SafeStyle {
		if (this.currentState.image.image.image)
			return this.sanitizer.bypassSecurityTrustStyle(`url('${this.currentState.image.image.image.location + '/' + encodeURIComponent(this.currentState.image.image.image.name)}')`);
		return '';
	}

	gotoThemes() {
		this.isEdit = false;
		(this._textTool.nativeElement as HTMLElement).style.display = 'none';
		this.refreshView();
	}

	selectedTheme(event: CommonItemContent<NavInfo>) {
		this.itemContent = event;
		this.isEdit = true;
		this._clearState.next(new EmptyCommand);
	}

	openDesignDialog() {
		this._stopEditLink.next();
		this._stopSubEditLink.next();

		let designDialog: DialogWindow<DesignDialogComponent>;

		if (this.currentState.design.design) {
			let designInfo = Object.assign(DesignInfo.empty(), this.currentState.design.design);
			designDialog = createDesignDialogWindow(this.windowService, designInfo);
		}
		else {
			designDialog = createDesignDialogWindow(this.windowService);
		}

		designDialog.componentRef.instance.submit.subscribe((result: DesignInfo) => {
			this._navDesign.next(new Design(result));
			designDialog.destroy();
		});

		designDialog.componentRef.instance.close.subscribe(() => {
			designDialog.destroy();
		});

		designDialog.kendoWindow.setOptions({
			// position: {
			// 	top: $('.design-dialog').offset().top + 30,
			// 	left: $('.design-dialog').offset().left - 450
			// },
			animation: {
				open: {
					effects: "slideIn:down fadeIn",
					duration: 500
				},
				close: {
					effects: "slide:top fadeOut",
					duration: 500
				}
			}
		});

		designDialog.open();
	}

	openImageDialog() {
		this._stopEditLink.next();
		this._stopSubEditLink.next();

		let imageDialog: DialogWindow<ImageDialogComponent>;
		if (this.currentState.image.image.image) {
			let imageInfo = Object.assign(ImageInfo.empty(), this.currentState.image.image);
			imageDialog = createImageDialogWindow(this.windowService, imageInfo);
		}
		else {
			imageDialog = createImageDialogWindow(this.windowService);
		}

		imageDialog.componentRef.instance.submit.subscribe((result: ImageInfo) => {
			if (result.size > this._spacing.value)
				this._spacing.setValue(result.size);
			this._navImage.next(new Image(result));
			imageDialog.destroy();
		});

		imageDialog.componentRef.instance.close.subscribe(() => {
			imageDialog.destroy();
		});

		imageDialog.kendoWindow.setOptions({
			// position: {
			// 	top: $('.image-dialog').offset().top + 10,
			// 	left: $('.image-dialog').offset().left - 450
			// },
			animation: {
				open: {
					effects: "slideIn:down fadeIn",
					duration: 500
				},
				close: {
					effects: "slide:top fadeOut",
					duration: 500
				}
			}
		});
		imageDialog.open();
	}

	openLinkingDialog() {
		const navIndex = this.currentState.selectedNavLink;
		const subNavIndex = this.currentState.selectedSubNavLink;
		
		if (navIndex < 0 && subNavIndex[0] < 0) return false;

		const linkDialog = createLinkingDialogWindow(this.windowService, new LinkingForm());

		if (navIndex >= 0) {
			linkDialog.changeInputs(c => {
				if (this.currentState.navLinks[navIndex].link)
					c.form.setLinkValue(
						new LinkFormData(
							new LinkSource('LinkSourceText', this.currentState.navLinks[navIndex].text),
							this.currentState.navLinks[navIndex].link
						)
					);
				else
					c.form.setLinkValue(
						new LinkFormData(
							new LinkSource('LinkSourceText', this.currentState.navLinks[navIndex].text)
						)
					);
			});
		} else {
			linkDialog.changeInputs(c => {
				if (this.currentState.navLinks[subNavIndex[0]].sublinks[subNavIndex[1]].link && this.currentState.navLinks[subNavIndex[0]].sublinks[subNavIndex[1]].link)
					c.form.setLinkValue(
						new LinkFormData(
							new LinkSource('LinkSourceText', this.currentState.navLinks[subNavIndex[0]].sublinks[subNavIndex[1]].text),
							this.currentState.navLinks[subNavIndex[0]].sublinks[subNavIndex[1]].link
						)
					);
				else
					c.form.setLinkValue(
						new LinkFormData(
							new LinkSource('LinkSourceText', this.currentState.navLinks[subNavIndex[0]].sublinks[subNavIndex[1]].text)
						)
					);
			});
		}
		linkDialog.componentRef.instance.submit.subscribe(res => {
			linkDialog.destroy();
			this.setNavLink(res);
		});
		linkDialog.componentRef.instance.close.subscribe(res => {
			linkDialog.destroy();
		});
		linkDialog.open();
	}

	openFeedbackDialog() {
        let feedabckWindow = createFeedbackDialogWindow(this.windowService, 'pick-link');
        feedabckWindow.open();
    }

	onSubmit() {
		if (!this.isActive('change')) return;
		this._linkWidth = 0;
		this._stopEditLink.next();

		setTimeout(() => {
			let state = this.currentState;
			let navLinks = state.navLinks.filter(navLink=>navLink.text.trim()!='');

			let width = (this._linksContainer.nativeElement as HTMLElement).clientWidth;
			let height = (this._linksContainer.nativeElement as HTMLElement).clientHeight - 20;

			if (state.layout == 'top') {
				width += 10 * (2 * navLinks.length - 1);
				height = Math.max(height, state.image.image.size + 10);
			}
			else {
				height -= 5 * (navLinks.length + 1); // 5 * (navLinks.length - 1) - 10 * navLinks.length;
			}

			let result = this.itemContent
				.setBox(this.itemContent.box.setBottom(this.itemContent.box.top + height))
				.setInfo(
					Maybe.just(
						new NavInfo(
							navLinks,
							state.layout,
							width,
							height,
							state.spacing,
							state.navFontStyle,
							state.subNavFontStyle,
							state.design.design,
							state.image.image
						)
					)
				);

			result.info.value.links.map((link: NavLink) => {
				if (state.subNavFontStyle)
					link.fontStyle = state.subNavFontStyle;
			});
			this.submit.next(result);
		});
	}

	setFontStyle(event: any) {
		if (this.currentState.selectedNavLink >= 0) {
			this._navFontStyle.next(new FontStyle(this.currentState.selectedNavLink, event));
		}
		else if (this.currentState.selectedSubNavLink[0] >= 0) {
			this._navSubFontStyle.next(new SubFontStyle(this.currentState.selectedSubNavLink[0],this.currentState.selectedSubNavLink[1],event));
		}
	}

	setTextToolPosition(linkEle : HTMLElement) {
		(this._textTool.nativeElement as HTMLElement).style.top = (this._canvasContainer.nativeElement as HTMLElement).offsetTop + linkEle.offsetTop - 70 - (this._canvasContainer.nativeElement as HTMLElement).scrollTop + 'px';
		(this._textTool.nativeElement as HTMLElement).style.left = linkEle.offsetLeft + 50 - (this._canvasContainer.nativeElement as HTMLElement).scrollLeft + 'px';
		(this._textTool.nativeElement as HTMLElement).style.display = 'block';
	}

	setNavLink(event: Link) {
		const navIndex = this.currentState.selectedNavLink;
		const subNavIndex = this.currentState.selectedSubNavLink;
		if (navIndex < 0 && subNavIndex[0]<0) return false;

		if (navIndex >= 0) {
			this._stopEditLink.next();
			setTimeout(() => {
				this._setLink.next([navIndex, event]);
			});
		}
		else {
			this._stopSubEditLink.next();
			setTimeout(() => {
				this._setSubLink.next([subNavIndex[0],subNavIndex[1], event]);
			});
		}
	}

	refreshView() {
		this.changeDetector.detectChanges();
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
