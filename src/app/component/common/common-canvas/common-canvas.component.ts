import { ViewChild, Component, ElementRef, ChangeDetectorRef, HostListener, AfterViewInit, OnInit, OnChanges, OnDestroy, Renderer, ViewChildren, QueryList,
    Input, Output, SimpleChanges, EventEmitter
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import { Store, select } from "@ngrx/store";
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import {
        cloneDeep as _cloneDeep,
        get as _get,
        findIndex as _findIndex,
        indexOf as _indexOf,
        isEqual as _isEqual,
        intersection as _intersection,
        max as _max,
        sortBy as _sortBy
    } from 'lodash';

import { DragSessionService, DragEvent, DragSession } from '@app-directives/drag-session/drag-session.service';
import { Rect, Box } from '@app-lib/rect/rect';
import { Lazy } from '@app-lib/rx/rx';
import { History } from '@app-lib/history/history';
import * as omitDeep from '@app-lib/functions/omit-deep';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Maybe } from '@app-lib/maybe/maybe';
import * as imageUrl from '@app-lib/functions/image-url';
import { UUID } from '@app-lib/uuid/uuid.service';

import { ContextMenu, SimpleMenuItem, InputMenuItem, MenuItemCssIcon, MenuItemImageIcon, DoubleMenuItem, SubMenuItem } from '@app-directives/context-menu/context-menu.directive';
import { elementRectPage, ancestors, pageToElement, elementOffsetRect } from '@app-lib/dom/dom';
import { drawHorizontalLine, drawVerticalLine, inchesToPixels } from '@app-lib/dom/graphics';
import { createLinkingDialogWindow, LinkingForm, WindowService, DialogWindow } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { createSkippingDialogWindow } from '@app-dialogs/skipping-dilaog/skipping-dialog.component';
import { createAttentionDialogWindow, AttentionInfo } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createButtonDialogWindow } from '@app-dialogs/button-dialog/button-dialog.component';
import { createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { createGalleryDialogWindow } from '@app-dialogs/gallery-dialog/gallery-dialog.component';
import { createNavigationDialogWindow } from '@app-dialogs/navigation-dialog/navigation-dialog.component';
import { createSlideshowDialogWindow } from '@app-dialogs/slideshow-dialog/slideshow-dialog.component';
import { createShapeDialogWindow } from '@app-dialogs/shape-dialog/shape-dialog.component';
import { createVideoDialogWindow } from '@app-dialogs/video-dialog/video-dialog.component';
import { createBorderDialogWindow, BorderInfo } from '@app-dialogs/border-dialog/border-dialog.component';
import { createBackgroundDialogWindow } from '@app-dialogs/background-dialog/background-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';

import { ElementSelectorComponent, SelectionEvent } from '@app-directives/element-selector/element-selector.component';
import { ClearGuides, Guide } from '@app-ui/ruler-overlay/ruler-overlay.component';
import {
    BackgroundInfo, BackgroundColorInfo, BackgroundImageInfo, BackgroundTilingInfo,
    ButtonInfo, GalleryInfo, NavInfo, SlideShowInfo, VideoInfo,
    ImagePath, Page, Link, LinkFormData, LinkSource, LinkSourceType,
    MultipleChoiceInfo, SingleTextInfo, SingleCheckBoxInfo, DropdownInfo, SingleDateInfo,
    DateInfo, TimeInfo, RatingInfo, RankInfo, EndSurveyInfo, MatrixChoiceInfo,
    SurveyMultiChoiceInfo, SurveySingleTextInfo, SurveyCommentInfo, Skip,
    SurveyMultiTextsInfo,
    Item, ItemType, ItemContent,
    ImageItemContent, TextItemContent, ItemGroupContent,
    ShapeItemContent,
    CommonItemContent
} from '@app/models';

import { ItemComponent } from '@app-items/item.component';
import { TextComponent } from '@app-items/text/text.component';
import { AppService } from '@app/app.service';
import { AlertService, TreeService } from '@app/services';

var canvg = require('canvg-browser');
const Find = require('find-key');
// ----------------------------------------------------------------
// Hotkeys
// ----------------------------------------------------------------
type ModKeys = 'ctrl' | 'shift' | 'alt';

const MOD_KEY_SELECTORS: { [k: string]: (e: MouseEvent | KeyboardEvent | Touch) => boolean } = {
    ctrl: (e: MouseEvent) => e.ctrlKey,
    shift: (e: MouseEvent) => e.shiftKey,
    alt: (e: MouseEvent) => e.altKey,
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
    groupItems: [{ key: 'g', modKeys: ['ctrl'] },
    { key: 'G', modKeys: ['ctrl'] }],
    copy: [{ key: 'c', modKeys: ['ctrl'] },
    { key: 'C', modKeys: ['ctrl'] }],
    paste: [{ key: 'v', modKeys: ['ctrl'] },
    { key: 'V', modKeys: ['ctrl'] }],
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
        // event.preventDefault();
        return true;
    } else {
        return false;
    }
}

// ----------------------------------------------------------------
// Commands
// ----------------------------------------------------------------
type Command =
    DeselectAllItems
    | SelectItems
    | SelectItem
    | ToggleItemsSelection
    | ToggleItemSelection
    | RemoveItems
    | AddItem
    | AddImage
    | AddText
    | SetImage
    | SetItem
    | GroupItems
    | UngroupItems
    | DragItem
    | ResizeItem
    | Undo
    | Redo
    | StartEditItem
    | SetBackground
    | UpdateFooterPosition

export class DeselectAllItems { }
export class SelectItems { constructor(public readonly items: Item[]) { } }
export class SelectItem { constructor(public readonly item: Item) { } }
export class ToggleItemsSelection { constructor(public readonly items: Item[]) { } }
export class ToggleItemSelection { constructor(public readonly item: Item) { } }
export class RemoveItems { constructor(public readonly items: Item[]) { } }
export class NonEditingItem { }
export class UpdateFooterPosition { constructor(public readonly maxBottom: number) {} }

export class AddItem { constructor(public readonly item: Item) { } }
export class AddText { constructor(public readonly box: Box = new Box(0, 300, 0, 100)) { } }
export class AddImage { }
export class AddImageFromDesktop { constructor(public readonly image: ImagePath, public readonly box: Box) { } }

export class SetBackground { constructor(public readonly background: BackgroundInfo) { } }
export class SetBorder { constructor(public readonly border: BorderInfo) { } }
export class SetImage { constructor(public readonly item: Item, public readonly image: ImagePath, public readonly box: Box) { } }
export class SetItem { constructor(public readonly items: Item[]) { } }
export class GroupItems { constructor(public readonly items: Item[]) { } }
export class UngroupItems { constructor(public readonly group: Item) { } }
export class DragItem { constructor(public readonly item: Item, public box: Box) { } }
export class ResizeItem { constructor(public readonly item: Item, public box: Box) { } }
export class RotateItem { constructor(public readonly item: Item, public readonly degree: number) { } }
export class Undo { }
export class Redo { }
export class StartEditItem { constructor(public readonly item: Item) { } }
export class ShowGrid { }
export class HideGrid { }
export class SetGridStep { constructor(public readonly step: number) { } }
export class ShowRulers { }
export class HideRulers { }
export class ColorBackground { }
export class ImageBackground { }
export class Copy { constructor(public readonly items: Item[]) { } }
export class Paste { }
class Border { }
class Background { }

export class SwitchGlobal { constructor(public readonly item: Item, public readonly global: boolean = true) { } }
export class DeleteContent { constructor(public readonly hf: number) { } }
export class RemoveFromAll { constructor(public readonly items: Item[]) { } }
export class BringForward { constructor(public readonly item: Item) { } }
export class BringToFront { constructor(public readonly item: Item) { } }
export class SendBackward { constructor(public readonly item: Item) { } }
export class SendToBack { constructor(public readonly item: Item) { } }
export class Lock { constructor(public readonly item: Item) { } }
export class Unlock { constructor(public readonly item: Item) { } }
export class ShowAddLinkDialog { }
export class Caption { }
export class Download { }
export class SimpleForm { }
export class SimpleSurvey { }
export class UpdateItem { constructor(public readonly item: Item, public newItem: Item) { } }
export class EmptyCommand { }
export class LoadPage { constructor(public doc: Page, public update: boolean = false) { } }

export class SetRequired { }
export class SetSkip { constructor(public readonly skip: Skip) { } }

type CanvasContextMenuCommand =
    ShowGrid
    | HideGrid
    | ShowRulers
    | HideRulers
    | ClearGuides
    | Background

type ItemContextMenuCommand =
    Copy
    | Paste
    | RemoveItems
    | BringForward
    | BringToFront
    | SendBackward
    | SendToBack
    | Lock
    | Unlock
    | Background
    | Border
    | ShowAddLinkDialog
    | SwitchGlobal

// ----------------------------------------------------------------
// History & state
// ----------------------------------------------------------------
class HistoryEntry<C, S, D> {
    constructor(
        public command: C,
        public state: S
    ) { }
}

const HISTORY_LENGTH = 7;

/** Don't save these commands in history. */
const DROP_FROM_HISTORY: Command[] = [
    DeselectAllItems, SelectItems, SelectItem, ToggleItemsSelection, ToggleItemSelection,
    StartEditItem, NonEditingItem,
    LoadPage, UpdateFooterPosition
];

class State {
    constructor(
        public items: Item[] = [],
        public selectedItems: Item[] = [],
        public editingItem: Item = null,
        public background: BackgroundInfo = BackgroundInfo.empty(),
        public unplacedGlobalItems: string[] = [],
        public removedImages: ImagePath[] = [],
        public boxes: Box[] = []
    ) { }
}

const NEW_ITEM_OFFSET_X = 10;
const NEW_ITEM_OFFSET_Y = 10;

const PASTE_ITEM_OFFSET_X = 25;
const PASTE_ITEM_OFFSET_Y = 25;

const STEP_ITEM = 1;
// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
    moduleId: module.id,
    selector: 'common-canvas',
    templateUrl: 'common-canvas.component.html',
    styleUrls: ['common-canvas.component.css']
})
export class CommonCanvasComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

    @Input('page') _page: Page = new Page();
    @Input() placeholder: Array<string> = [''];
    @Input() minHeight: number = 200;
    @Input() height: number = 500;
    @Input() loading: boolean = false;
    @Input() maxWidth: number = 1100;
    @Input() width: number = 1100;
    @Input() pageLayout: number = 1; // 1: Tablet, 2: mobile
    @Input() extraScrollTop: number = 0; // For the position of new Item in Marketing Email and Blog
    @Input() thumbEle: HTMLElement;
    @Input() editable: boolean = true;
    @Input() animation: boolean = false;
    @Input() _resizable: boolean = true;
    @Input() extraLeft: number = 0;
    @Input() extraTop: number = 0;
    @Input() readOnly: boolean = false;
    @Input() zoomable: boolean = true;
    @Input() showGrid: boolean = false;

    @Output('itemRemove') itemRemoveEmit = new EventEmitter<Item>();
    @Output('outLink') outLink = new EventEmitter<Link>();

    @ViewChild('canvasScroll') public _canvasScroll: ElementRef;
    get canvasScrollElem(): HTMLElement {
        return (this._canvasScroll.nativeElement as HTMLElement);
    }

    @ViewChild('canvas') public _canvas: ElementRef;
    get canvasElem(): HTMLElement { return (this._canvas.nativeElement as HTMLElement); }

    @ViewChild(LoadingComponent) private loadingComponent: LoadingComponent;
    @ViewChild(ElementSelectorComponent) elementSelector: ElementSelectorComponent;
    @ViewChildren(ItemComponent) public _itemComponents: QueryList<ItemComponent>;

    get selectedItemComponents(): ItemComponent[] {
        if (this._itemComponents)
            return this._itemComponents.toArray().filter(i => this.currentState.selectedItems.indexOf(i.item) >= 0);
        else
            return [];
    }

    public canvasHPadding = 10;
    public canvasWPadding = 5;
    public _threshold = 768;
    public _bodyBottom = 0;
    public backgroundImageHeight: number = 0; // for the background image height
    public bodyBackgroundImageHeight: number = 0;
    public enableBackgroundImageHeight: boolean = false;
    public isActiveUndo: boolean = false;
    public isActiveRedo: boolean = false;

    public loadingText = 'Saving...';
    public ServiceItems = ['DonationItem', 'EventSetupItem', 'PhotoItem', 'AppointmentItem'];
    public hasBackgroundItems = ['TextItem', 'ImageItem', 'NavItem', 'FormItem', 'AppointmentItem', 'DonationItem', 'EventSetupItem'];
    public hasBorderItems = ['TextItem', 'ImageItem', 'NavItem', 'FormItem', 'AppointmentItem', 'DonationItem', 'EventSetupItem'];  // ---------------------- Inputs ---------------------------------------

    public _canvasMouseDown = new Subject<MouseEvent>();
    public _canvasMouseUp = new Subject<MouseEvent>();
    public _itemMouseDown = new Subject<[Item, MouseEvent]>();
    public itemMenu: boolean = false; // current context menu is item menu?
    public contextLEnable: boolean = false;
    public contextLEnableItem: Item = null;
    public contextLPageX: number = 0;
    public contextLPageY: number = 0;
    public rightSelectedItem: Item | null = null;
    public _itemClick = new Subject<[Item, MouseEvent]>();
    public _selectionEnd = new Subject<SelectionEvent>();
    public _selectItems = new Subject<Item[]>();
    public _deselectionAllItems = new Subject<void>();
    public _nonEditingItem = new Subject<void>();
    public _canvasScrollScroll = new Subject<UIEvent>();

    public _canvasContextMenuCommand = new Subject<CanvasContextMenuCommand>();
    public _itemContextMenuCommand = new Subject<[Item, ItemContextMenuCommand]>();
    public _itemContextMenuShown = new Subject<Item>();

    private dragStartHeaderBox: Box = new Box(0, 10, 0,10);  // for only dragging Header
    private dragStartItemBox: Box = new Box(0, 10, 0, 10);
    private dragItemPrevTop: number = 0;

    public _dragEnd = new Subject<[Item, Box]>();
    public _resizeEnd = new Subject<[Item, Box]>();
    public _rotateEnd = new Subject<[Item, number]>();

    private _addText = new Subject<Box>();
    private _addImage = new Subject<void>();
    private _addImageFromDesktop = new Subject<[ImagePath, Box]>();
    private _addItem = new Subject<Item>();
    private _updateFooterPosition = new Subject<number>();
    private _setBackground = new Subject<BackgroundInfo>();
    private _setBorder = new Subject<BorderInfo>();
    private _setItem = new Subject<Item[]>();
    private _setImage = new Subject<[Item, ImagePath, Box]>();
    private _setLink = new Subject<[Item, Link]>();
    public _setReqiured = new Subject<void>();
    public _setSkip = new Subject<Skip>();
    private _undo = new Subject<void>();
    private _redo = new Subject<void>();

    private _keyboardEvent = new Subject<KeyboardEvent>();
    public _guidesChange = new Subject<Guide[]>();
    public _windowResize = new Subject<UIEvent>();

    public _itemChange = new Subject<[Item, Item]>();
    public _itemRemoves = new Subject<Item[]>();
    public _itemRemovesAllPage = new Subject<Item[]>();

    // ------------------------ State -------------------------------------
    public resultItems: any = [];
    public items: Item[] = [];
    public selectedItem: Item;
    public editingItem: Item;
    public backgroundInfo: BackgroundInfo = BackgroundInfo.empty();

    public history: Lazy<Observable<History<HistoryEntry<Command, State, boolean>>>>;
    public newHistoryEntry: Observable<HistoryEntry<DeselectAllItems, State, boolean>>;
    public currentState: State = new State();

    public _contextMenu: CanvasContextMenuCommand;
    public _contextMore: boolean = false;

    public _showGrid: boolean = false;
    public _gridStep: number = 0.5;
    public _gridImage: string = '';
    public _guide: Guide[] = [];
    public _clipboard: Item[] = [];
    public _showRulers: boolean = false;
    public _toggleRulersCommand: Observable<ShowRulers | HideRulers>;

    public _canvasScrollTop: number = 0;
    public _canvasBox: Box = new Box();
    public _containerWidth: number = 1100;
    public _containerHeight: number = 768;
    processing: boolean = false;
    public _clearGuidesCommand: Observable<ClearGuides>;
    public stateCommands: Observable<any>;

    // ---------------------------------------------------------------------
    public _updatePage = new Subject<[Page, boolean]>();  //page, update app.service,
    public _clearDocument = new Subject<void>();
    public cancelled: boolean = false;

    private viewInited: boolean = false;
    private openedDialog: boolean = false;

    private callingAPI: Subscription;
    private subs: Subscription[] = [];

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private elementRef: ElementRef,
        private sanitizer: DomSanitizer,
        private renderer: Renderer,
        private alertService: AlertService,
        private appService: AppService,
        private treeService: TreeService,
        private windowService: WindowService
    ) { }

    ngOnInit() {
        this._containerHeight = this.canvasScrollElem.offsetHeight;
        this._canvasBox = elementOffsetRect(this.canvasElem).toBox();
        this._clipboard = this.appService._clipboard;
        this._showGrid = this.showGrid;
        if (this._showGrid) {
          this._gridImage = this.genGridImage(inchesToPixels(this._gridStep));
        }

        const dragItem = this._dragEnd
            .filter(([item, box]) => !Box.compare(item.content.box, box))
            .map(([item, box]) => new DragItem(item, box))
            .publish().refCount();

        const resizeItem = this._resizeEnd
            .filter(([item, box]) => item.itemType != 'HFItem' && !Box.compare(item.content.box, box) || item.itemType == 'HFItem' && (this.dragStartHeaderBox.top != box.top || this.dragStartHeaderBox.left != box.left || !Box.compare(item.content.box, box)))
            .map(([item, box]) => new ResizeItem(item, box))
            .publish().refCount();

        const rotateItem = this._rotateEnd
            .map(([item, n]) => new RotateItem(item, n))
            .publish().refCount();

        const startSelection = this._canvasMouseDown
            .filter((e) => e.button === 0) // Left mouse button.
            // .filter(([e,hf]) => this._targetIsCanvasOrItem(e,hf))
            .filter((event) => {
                // Don't start selection inside editable item.
                console.log('start selection', this.editingItem);
                if (!this.editingItem) return true;
                const { x, y } = this.pageToCanvas(event.pageX, event.pageY, 0);
                return !this.appService.rotatedPosition(this.editingItem.content.box, this.getRotation(this.editingItem)).isPointInside(x, y);
            })
            .publish().refCount();

        const selectionRunning = startSelection.map(() => true)
            .merge(this._selectionEnd.pipe().map((event) => {
                return false;
            }))
            .createBehavior(false);

        const dragOrResizing = Observable.merge(
            Observable.of(false),
            dragItem.pipe().map(() => true),
            resizeItem.pipe().map(() => true),
            startSelection.pipe().map(() => false),
            this._canvasMouseUp.pipe().map(() =>false)
        );

        const deselectAllItems = this._selectionEnd
            .filter( event => {
              return event.box.width() == 0 && event.box.height() == 0
            })
            .filter(event => {
              return this.resultItems.filter(item =>
                this.appService.rotatedPosition(item.content.box, this.getRotation(item)).isPointInside(event.box.left, event.box.top)).length === 0
            })
            .merge(this._deselectionAllItems)
            .map(() => new DeselectAllItems)
            .publish().refCount();

        const checkItemMenu = this._canvasMouseDown
            .filter((e) => e.button === 2)
            .map((e) => this._targetIsItem(e));

        const [toggleItemSelection, [startEditItem, selectItemClick]] = this._itemClick
            .filter(([_item, event]) => {
                return (event.button === 0 && !this.contextLEnable);
                //return(event.button === 0 && !this.contextLEnable && !['DonationItem'].some(i=>i==_item.itemType));
            })
            .withLatestFrom(dragOrResizing)
            .filter(([[_item, event], dr]) => !dr)
            .partitionMap(
                ([[_item, event], dr]) => MOD_KEY_SELECTORS[MOD_KEYS.addOrRemoveFromSelection](event),
                yes => yes.map(([[item, _event], dr]) => { return new ToggleItemSelection(item) }).publish().refCount(),
                no =>
                    no.partitionMap(
                        ([[item, _e], dr]) => {
                            return (this.currentState.selectedItems.length === 1
                                && this.currentState.selectedItems[0] === item)
                        },
                        y => y.filter(([[item, _e], dr]) => this.editingItem !== item) // Don't start edit if edit is under way.
                            .map(([[item, _e], dr]) => new StartEditItem(item)).publish().refCount(),
                        n => n.map(([[item, _e], dr]) => new SelectItem(item)).publish().refCount())
            );

        const selectItem = selectItemClick
            // .merge(this._itemContextMenuShown.asObservable().map(item => new SelectItem(item)))
            .publish().refCount();

        const [toggleItemsSelection, selectItems] = this._selectionEnd
            .filter(event =>
                event.mouseEvent
                && (event.box.width() > 0 || event.box.height() > 0))
            .map<any, [SelectionEvent, Item[]]>(event => {
                return [event, this.items.filter(item => event.box.doesIntersect(item.content.box) && item.hf == 0)]
            })
            .publish().refCount()
            .partitionMap(([event, _items]) =>
                MOD_KEY_SELECTORS[MOD_KEYS.addOrRemoveFromSelection](event.mouseEvent),
                yes => yes.map(([_e, items]) => new ToggleItemsSelection(items)).publish().refCount(),
                no => no.map(([_e, items]) => new SelectItems(items)).publish().refCount());

        const removeItems = Observable
            .merge(
                this._keyboardEvent
                    .filter(e => checkCommandHotkey(COMMAND_HOTKEYS.removeItems, e))
                    .map(_e => new RemoveItems(this.currentState.selectedItems)),
                this._itemContextMenuCommand
                    .filter(([_i, c]) => c instanceof RemoveItems)
                    .map(([_i, c]) => c as RemoveItems),
                this._itemRemoves.asObservable().map(i => new RemoveItems(i)))
            .publish().refCount();

        const [groupItems, ungroupItems] = this._keyboardEvent
            .filter(e => checkCommandHotkey(COMMAND_HOTKEYS.groupItems, e))
            .publish().refCount()
            .partitionMap(_e =>
                this.currentState.selectedItems.length > 1,
                yes => yes.map(_e => new GroupItems(this.currentState.selectedItems))
                    .publish().refCount(),
                no => no.filter(_e =>
                    this.selectedItem.itemType === 'ItemGroup')
                    .map(_e => new UngroupItems(this.selectedItem))
                    .publish().refCount());

        const undo = this._undo.asObservable()
            .merge(this._keyboardEvent
                .filter(e => checkCommandHotkey(COMMAND_HOTKEYS.undo, e)))
            .map(() => new Undo)
            .publish().refCount();

        const redo = this._redo.asObservable()
            .merge(this._keyboardEvent
                .filter(e => checkCommandHotkey(COMMAND_HOTKEYS.redo, e)))
            .map(() => new Redo)
            .publish().refCount();

        this._toggleRulersCommand = Observable.merge(
            this._canvasContextMenuCommand.filterInstance(ShowRulers),
            this._canvasContextMenuCommand.filterInstance(HideRulers));

        const canvasResized =
            Observable.merge(
                this._toggleRulersCommand,
                this._windowResize)
                .map(() => elementOffsetRect(this.canvasElem).toBox())
                .publish().refCount();

        this._clearGuidesCommand = this._canvasContextMenuCommand
            .filterInstance(ClearGuides);

        const order = <Observable<BringForward | BringToFront | SendBackward | SendToBack>>
            this._itemContextMenuCommand
                .filter(([_item, command]) =>
                    [BringForward, BringToFront, SendBackward, SendToBack]
                        .some(ctor => command instanceof ctor))
                .map(([_item, command]) => command);

        const paste =
            Observable.merge(
                this._itemContextMenuCommand
                    .map(([_item, command]) => command)
                    .filterInstance(Paste),
                this._canvasContextMenuCommand
                    .filterInstance(Paste),
                this._keyboardEvent
                    .filter(e => checkCommandHotkey(COMMAND_HOTKEYS.paste, e))
                    .map(e => new Paste())
            )
                .publish().refCount();

        const lock = this._itemContextMenuCommand.map(([_item, command]) => command)
            .filterInstance(Lock);

        const unlock = this._itemContextMenuCommand.map(([_item, command]) => command)
            .filterInstance(Unlock);

        const switchGlobal = this._itemContextMenuCommand.map(([_item, command]) => command)
            .filterInstance(SwitchGlobal);

        const removeFromAll = Observable.merge(
                this._itemRemovesAllPage.map(items => new RemoveFromAll(items)),
                this._itemContextMenuCommand.map(([_item, command]) => command)
                    .filterInstance(RemoveFromAll)
            ).publish().refCount();

        const itemChange = this._itemChange.map(([item, newItem]) => new UpdateItem(item, newItem));

        const loadItems = Observable.merge(
            Observable.of(new LoadPage(this._page, false)),
            this._updatePage.map(([page, update]) => new LoadPage(page, update))
        ).publish().refCount();

        this.stateCommands = Observable.merge(
            deselectAllItems,
            selectItems,
            selectItem,
            toggleItemsSelection,
            toggleItemSelection,
            this._selectItems.map(items=> new SelectItems(items)),
            this._nonEditingItem.map(() => new NonEditingItem()),
            this._addItem.map((item: Item) => new AddItem(item)),
            this._addImage.map(() => new AddImage),
            this._addImageFromDesktop.map(([image, box]) => new AddImageFromDesktop(image, box)),
            this._addText.map((box) => new AddText(box)),
            this._setItem.map((items: Item[]) => new SetItem(items)),
            this._setBackground.map((backgroundInfo) => new SetBackground(backgroundInfo)),
            this._setBorder.map(borderInfo => new SetBorder(borderInfo)),
            this._setImage.map(([item, image, box]) => {
                return new SetImage(item, image, box)
            }),
            this._setLink.map(([item, link]) => new UpdateItem(item, item.setContent((item.content as any).setLink(link)))),
            this._setReqiured.asObservable().map(() => new SetRequired()),
            this._setSkip.asObservable().map((skip: Skip) => new SetSkip(skip)),
            this._clearDocument.asObservable().map(() => { let page = new Page(); page.items = []; return new LoadPage(page); }),
            this._updateFooterPosition.map((res) => new UpdateFooterPosition(res)),
            removeItems,
            groupItems,
            ungroupItems,
            dragItem,
            resizeItem,
            rotateItem,
            startEditItem,
            order,
            paste,
            lock,
            unlock,
            switchGlobal,
            removeFromAll,
            itemChange,
            loadItems
        ).publish().refCount();

        const someItems = (items: Item[], pred: (item: Item) => boolean) => {
            const go: (item: Item) => boolean = (item: Item) =>
                item.content instanceof ItemGroupContent
                    ? item.content.items.some(go)
                    : pred(item);

            return items.some(go);
        };

        const initialHistoryEntry = new HistoryEntry<Command, State, boolean>(new EmptyCommand(), new State);
        const initialHistory = new History(initialHistoryEntry, [], [], HISTORY_LENGTH);

        this.history = new Lazy(() =>
            this.newHistoryEntry
                .merge(undo)
                .merge(redo)
                .scan<any, History<HistoryEntry<Command, State, boolean>>>((history, x) => {
                    if (x instanceof HistoryEntry) {
                        if (DROP_FROM_HISTORY.some(c => x.command instanceof <any>c)) {
                            return history.modifyCurrentState(
                                new HistoryEntry(history.current.command, x.state));
                        }
                        else {
                            return history.push(x);
                        }
                    }
                    else {
                        return x instanceof Undo
                            ? history.undo()
                            : history.redo()
                    }
                }, initialHistory

            ));

        this.newHistoryEntry = this.stateCommands
            .map(command => {
                return new HistoryEntry(
                    command,
                    this.updateState(this.currentState, command)
                )
            })
            .publish().refCount();

        this._contextMenu = this.createCanvasContextMenu(this._gridStep, this._gridImage, this._showRulers, [], []);

        this.subs = [
            this.history.value.subscribe(res => {
                let currentCommand: any = res.current.command;
                this.isActiveRedo = res.next.length > 0;
                this.isActiveUndo = res.previous.length > 0;
                res.current.state.items.forEach((i, index) => {
                    if (res.current.state.boxes[index] && i.content.box != res.current.state.boxes[index]) {
                        i.content.box = res.current.state.boxes[index];
                    }
                });
                this.currentState = res.current.state;
                this.backgroundInfo = this.currentState.background;
                this.items = this.currentState.items;
                this.editingItem = this.currentState.editingItem;
                this.selectedItem = this.currentState.selectedItems.length > 0 ? this.currentState.selectedItems[0] : null;

				this.resultItems = this.items.filter(item => item.hf <= 0);
				console.log('refresh')
                this.refreshView();

                if (currentCommand && [AddItem, AddImage, AddImageFromDesktop, SetImage, AddText, DragItem, RotateItem, ResizeItem, SetItem, UpdateItem, RemoveItems, SetBackground, SetBorder, UpdateFooterPosition, EmptyCommand].findIndex(i => currentCommand instanceof i) >= 0) {
                    setTimeout(() => {
                        this.setCanvasSize();
                    })
                }
            }),

            this._canvasContextMenuCommand.subscribe(r => {
                switch (r.constructor) {
                    case ShowGrid:
                        this._showGrid = true;
                        this._gridImage = this.genGridImage(inchesToPixels(this._gridStep));
                        break;
                    case HideGrid:
                        this._showGrid = false;
                        this._gridImage = '';
                        break;
                    case ShowRulers:
                        this._showRulers = true;
                        break;
                    case HideRulers:
                        this._showRulers = false;
                        break;
                    case SetGridStep:
                        this._gridStep = (r as SetGridStep).step;
                        this._gridImage = this._showGrid ? this.genGridImage(inchesToPixels(this._gridStep)) : '';
                        break;
                }
                this._contextMenu = this.createCanvasContextMenu(this._gridStep, this._gridImage, this._showRulers, this._guide, this._clipboard);
                this.refreshView();
            }),

            this._guidesChange.subscribe(r => {
                this._guide = r;
            }),

            this._itemContextMenuCommand.subscribe(([item, command]) => {
                switch (command.constructor) {
                    case Copy:
                        this._clipboard = (command as Copy).items;
                        this.appService._clipboard = this._clipboard;
                        this._contextMenu = this.createCanvasContextMenu(this._gridStep, this._gridImage, this._showRulers, this._guide, this._clipboard);
                        break;
                    case ShowAddLinkDialog:
                        this.openLinkDialog(item);
                        break;
                }
                this.refreshView();
            }),

            canvasResized.subscribe(() => {
                this._canvasBox = elementOffsetRect(this.canvasElem).toBox();
                this._threshold = Math.floor(768 * this.canvasElem.offsetWidth / 1100);
                this._containerWidth = this.canvasScrollElem.clientWidth;
                this._containerHeight = this.canvasScrollElem.offsetHeight;
                this.refreshView();
            }),

            this._canvasScrollScroll.subscribe((event) => {
                this._canvasScrollTop = this.canvasScrollElem.scrollTop;
            }),

            this._keyboardEvent.subscribe(e => {
                if (!this.selectedItem || this.editingItem) return;

                if (checkCommandHotkey(COMMAND_HOTKEYS.copy, e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this._clipboard = this.currentState.selectedItems;
                    this.appService._clipboard = this._clipboard;
                    this._contextMenu = this.createCanvasContextMenu(this._gridStep, this._gridImage, this._showRulers, this._guide, this._clipboard);
                }
                else {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;

                    e.preventDefault();
                    e.stopPropagation();

                    const item = this.selectedItem;
                    const cbox = this.canvasBox(item.hf);
                    let dx = 0;
                    let dy = 0;

                    switch (e.key) {
                        case 'ArrowUp': dy = -Math.min(STEP_ITEM, item.content.box.top); break;
                        case 'ArrowDown': dy = STEP_ITEM; break;
                        case 'ArrowLeft': dx = -Math.min(STEP_ITEM, item.content.box.left); break;
                        case 'ArrowRight': dx = Math.min(STEP_ITEM, cbox.right - item.content.box.right); break;
                    }
                    const newBox = item.content.box.moveBy(dx, dy);
                    this.onItemDrag(item, newBox);
                    this.onItemDragEnd(item, newBox);
                }
            }),

            startSelection.subscribe((e) => {
                this.elementSelector.startSelection(this.canvasRectPage(), e.pageX, e.pageY);
                setTimeout(() => {
                    this._canvasBox = new Box(this._canvasBox.left, this._canvasBox.right, this._canvasBox.top, this.canvasElem.offsetHeight);
                })
            }),

            checkItemMenu.subscribe((result: boolean) => {
                this.itemMenu = result;
                this.refreshView();
            }),

            this._itemMouseDown.asObservable()
                .map(([item, e]) => {
                    e.stopPropagation();
                    if (e.button === 2) {
                        this.itemMenu = true;
                        return (item != this.editingItem) ? item : null;
                    }
                    else
                        return null;
                }).subscribe((result: Item) => {
                    this.rightSelectedItem = result;
                })
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['_page'] && changes['_page'].currentValue) {
            if (this.viewInited)
                this._updatePage.next([this._page, false]);
        }
        if (changes['minHeight'] && changes['minHeight'].currentValue != '' && this.canvasElem) {
            this.canvasElem.style.minHeight = this.minHeight + 'px';
        }
        if (changes['height'] && changes['height'].currentValue != '' && this.canvasElem) {
            this.canvasElem.style.height = this.height + 'px';
        }
    }

    ngAfterViewInit() {
        this.viewInited = true;
    }

    setBackgroundHeight(event: number) {
        // if (!this.enableBackgroundImageHeight) return;
        this.enableBackgroundImageHeight = false;
        this.backgroundImageHeight = this.bodyBackgroundImageHeight;
    }

    getRotation(item: any): number {
        return item.content.rotate ? item.content.rotate : 0;
    }

    updateState(state: State, command: Command): State {
        let newState = new State(state.items, state.selectedItems, state.editingItem, state.background, state.unplacedGlobalItems, state.removedImages);

        const updateItem = (item: Item, updater: (item: Item) => Item) => {
            const newItem = updater(item);
            newState.items = newState.items.map(i => i !== item ? i : newItem);
            newState.selectedItems = [newItem];
        };

        this.animation = false;
        this.processing = false;

        if (command instanceof StartEditItem) {
            newState.editingItem = command.item;
            this.onStartEditItem(command.item);
            return newState;
        } else {
            newState.editingItem = null;
        }

        if (command instanceof DeselectAllItems) {
            newState.selectedItems = [];
            newState.editingItem = null;
        } else if (command instanceof SelectItems) {
            newState.selectedItems = command.items.filter(item => !this.isSurveyItem(item));
        } else if (command instanceof SelectItem) {
            let item = command.item;
            newState.selectedItems = [item];
            if (_indexOf(['EcommerceItem'], item.itemType) >= 0)
                newState.items = _sortBy(newState.items, i => {
                    return _isEqual(i, item);
                });
        } else if (command instanceof ToggleItemsSelection) {
            const add = command.items.filter(i => newState.selectedItems.indexOf(i) < 0);
            const keep = newState.selectedItems.filter(i => command.items.indexOf(i) < 0);
            newState.selectedItems = keep.concat(add);

        } else if (command instanceof ToggleItemSelection) {
            newState.selectedItems = newState.selectedItems.indexOf(command.item) >= 0
                ? newState.selectedItems.filter(i => i !== command.item)
                : [...newState.selectedItems, command.item];

        } else if (command instanceof RemoveItems) {
            command.items.forEach(i => {
                if (i.global && i.hf <= 0) {
                    if (i.uid && _findIndex(this.appService._globalItems, gi => gi.uid == i.uid) >= 0 && newState.unplacedGlobalItems.indexOf(i.uid) < 0) {
                        newState.unplacedGlobalItems.push(i.uid);
                    }
                }
            });
            newState.selectedItems = [];
            newState.items = newState.items.filter(i => command.items.indexOf(i) < 0);

        } else if ([AddText, AddImage, AddImageFromDesktop, AddItem].some(c => command instanceof c)) {
            this.animation = true;

            let newItem =
                command instanceof AddText ? new Item(0, 0, UUID.UUID(), 'TextItem', new TextItemContent(command.box, this.appService.currentTextToolColor), 0, false, false, 100, this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '', this._page.service) :
                    command instanceof AddImage ? new Item(0, 0, UUID.UUID(), 'ImageItem', new ImageItemContent(), 0, false, false, 100, this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '', this._page.service) :
                        command instanceof AddImageFromDesktop ? new Item(0, 0, UUID.UUID(), 'ImageItem', new ImageItemContent(command.box, null, command.image), 0, false, false, 100, this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '', this._page.service) :
                            (<AddItem>command).item.setUID(UUID.UUID()).setListingUid(this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '').setService(this._page.service);

            if (this.pageLayout == 2) {
                newItem.content.mView = 3;
            }

            newItem = newItem.setContent(
              newItem.content.setBox(
                  this._findPlace(
                      this.isSurveyItem(newItem) ? newItem.content.box.moveTo(20, 20) : this._centerBox(newItem, 0),
                      newState.items,
                      NEW_ITEM_OFFSET_X,
                      NEW_ITEM_OFFSET_Y
                  )));

            newState.items = [...newState.items, newItem];

            if (_indexOf(['TextItem', 'EcommerceItem'], newItem.itemType) >= 0 || newItem.itemType == 'ImageItem' && !(<ImageItemContent>newItem.content).image) {
                newState.selectedItems = [newItem];
            }

        } else if (command instanceof SetItem) {
            let box = command.items[1].content.box;
            let left = box.left;
            let right = box.right;
            let top = box.top;
            let bottom = box.bottom;

            if (_indexOf(['DonationItem', 'EventSetupItem'], command.items[1].itemType) >= 0) {
                left = Math.max((this.canvasElem.offsetWidth - box.width()) / 2, 0);
                right = left + box.width();
            }
            else {
                if (box.width() > this.canvasElem.offsetWidth - 2 * this.canvasWPadding) {
                    left = this.canvasWPadding;
                    right = this.canvasElem.offsetWidth - this.canvasWPadding;
                }
            }

            command.items[1] = command.items[1].setContent(command.items[1].content.setBox(new Box(left, right, top, bottom)));
            updateItem(command.items[0], (item: any) => command.items[1]);

        } else if (command instanceof SetImage) {
            updateItem(command.item, item => item.setContent((item.content as ImageItemContent).setImage(command.image).setBox(command.box)));
            newState.selectedItems = [];

        } else if (command instanceof SetBackground) {
            let survey_items = this.items.filter(item => item.itemType == 'SurveyItem');

            if (this.selectedItem && _indexOf(this.hasBackgroundItems, this.selectedItem.itemType) >= 0) {
                let item: any = this.selectedItem;
                updateItem(item, (item: any) => item.setContent(item.content.setBackInfo(Maybe.just(command.background))));

            }
            else if (survey_items.length > 0) {
                updateItem(survey_items[0], (item: any) => item.setContent(item.content.setBackInfo(Maybe.just(command.background))));
            }
            else {
                this.enableBackgroundImageHeight = true;
                newState.background = (<SetBackground>command).background;
            }

        } else if (command instanceof SetBorder) {
            let survey_item = this.items.find(item => item.itemType == 'SurveyItem');
            if (this.selectedItem) {
                updateItem(this.selectedItem, (item: any) => item.setContent(item.content.setBorderInfo(Maybe.just(command.border))));
            }
            else if (survey_item) {
                updateItem(survey_item, (item: any) => item.setContent(item.content.setBorderInfo(Maybe.just(command.border))));
            }

        } else if (command instanceof GroupItems) {
            let items = newState.items.filter(i => command.items.indexOf(i) >= 0);

            ItemGroupContent.group(items).map(itemGroup => {
                let newGroupItem = new Item(0, 0, UUID.UUID(), 'ItemGroup', itemGroup, command.items[0].hf, false, false, 100, this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '', this._page.service);
                newState.items = newState.items.filter(i => command.items.indexOf(i) < 0);

                if (newState.items.length > 0)
                    newGroupItem.sequence = newState.items[newState.items.length - 1].sequence + 1;

                newState.items.push(newGroupItem);
                newState.selectedItems = [newGroupItem];
            });

        } else if (command instanceof UngroupItems) {
            const ungroupedItems = (command.group.content as ItemGroupContent).ungroup();
            newState.items = [
                ...newState.items.filter(i => i !== command.group),
                ...ungroupedItems
            ];
            newState.selectedItems = ungroupedItems;

        } else if (command instanceof RotateItem) {
            updateItem(command.item, item => item.setContent((item.content as ShapeItemContent).setRotate(command.degree)));

        } else if (command instanceof ResizeItem || command instanceof DragItem) {
            let newSelectedItems: Item[] = [];
            if (command instanceof DragItem) {
                newState.selectedItems.forEach(i => {
                    if (i != command.item) {
                        updateItem(i, item => item.setContent(item.content.setBox(item.content.box.moveBy(command.box.left - command.item.content.box.left, command.box.top - command.item.content.box.top))));
                        newSelectedItems.push(...newState.selectedItems);
                    }
                });
            }

            if (command instanceof ResizeItem && command.item.itemType == 'TextItem') {
                updateItem(command.item, item => item.setContent(item.content.setBox(command.box)));
            } else {
                command.item.content.box = _cloneDeep(command.box);
            }

            if (newSelectedItems.length > 0) {
                newState.selectedItems = [...newSelectedItems, command.item];
            }

        } else if (command instanceof BringForward) {
            const index = newState.items.indexOf(command.item);
            if (index < newState.items.length - 1) {
                let items = newState.items.concat([]);
                items.splice(index, 1);
                items.splice(index + 1, 0, command.item);
                items[index + 1].sequence = items[index + 1].sequence + 1;
                newState.items = items;
            }
        } else if (command instanceof SendBackward) {
            const index = newState.items.indexOf(command.item);
            const serviceIndex = newState.items.findIndex(i => ![...this.ServiceItems, 'HFItem'].some(type => type == i.itemType));
            if (index > 0 && index > serviceIndex) {
                let items = newState.items.concat([]);
                items.splice(index, 1);
                items.splice(index - 1, 0, command.item);

                items[index - 1].sequence = items[index - 1].sequence - 1;
                // items = _orderBy(items,['sequence'],['asc']);
                newState.items = items;
            }
        } else if (command instanceof BringToFront) {
            const index = newState.items.indexOf(command.item);
            if (index < newState.items.length - 1) {
                const items = newState.items.concat([]);
                items.splice(index, 1);
                newState.items = items.concat([command.item]);
                if (newState.items.length > 1)
                    newState.items[newState.items.length - 1].sequence = newState.items[newState.items.length - 2].sequence + 1;
            }
        } else if (command instanceof SendToBack) {
            const index = newState.items.indexOf(command.item);
            if (index > 0) {
                const serviceIndex = newState.items.findIndex(i => ![...this.ServiceItems, 'HFItem'].some(type => type == i.itemType));
                newState.items.splice(index, 1);
                if (serviceIndex >= 0)
                    newState.items.splice(serviceIndex, 0, command.item);
                else
                    newState.items = [command.item].concat(newState.items);

                if (newState.items[serviceIndex + 1])
                    newState.items[serviceIndex].sequence = newState.items[serviceIndex + 1].sequence - 1;
            }
        } else if (command instanceof Paste) {
            const newItems = this._clipboard.map(item => {
                item = _cloneDeep(item.setContent(
                    item.content.setBox(
                        this._findPlace(
                            this._centerBox(item, 0),
                            newState.items,
                            PASTE_ITEM_OFFSET_X,
                            PASTE_ITEM_OFFSET_Y,
                            0)))
                    .setHF(0));
                // .setUID(UUID.UUID());
                return item;
            });

            newState.items = newState.items.concat(newItems);
            newState.selectedItems = newItems;

        } else if (command instanceof Lock) {
            updateItem(command.item, item => item.setLocked(true));

        } else if (command instanceof Unlock) {
            updateItem(command.item, item => item.setLocked(false));

        } else if (command instanceof RemoveFromAll) {
            newState.selectedItems = [];
            newState.items = newState.items.filter(i => !command.items.find(ri=>ri.uid==i.uid));

        } else if (command instanceof SwitchGlobal) {
            let uids = [];
            if (command.item.uid)
                uids.push(command.item.uid);

            if (command.item.itemType == 'ItemGroup') {
                command.item.content['items'].forEach(item=> {
                    item.global = command.global;
                    uids.push(item.uid);
                })
            }
            updateItem(command.item, item => item.setGlobal(command.global));

            if (!command.global)
                newState.unplacedGlobalItems = newState.unplacedGlobalItems.filter(uid => uids.indexOf(uid) < 0);
            else {
                uids.forEach(uid=> {
                    if (_findIndex(this.appService._globalItems, gi=> gi.uid == uid) >= 0 && _findIndex(newState.unplacedGlobalItems, i => i == uid) < 0) {
                        newState.unplacedGlobalItems.push(command.item.uid);
                    }
                })
            }

        } else if (command instanceof UpdateItem) {
            let selected = newState.selectedItems.findIndex(item => item == command.item) >= 0;
            updateItem(command.item, item => command.newItem);
            if (selected)
                newState.editingItem = command.newItem;

        } else if (command instanceof NonEditingItem) {
            newState.editingItem = null;
            newState.selectedItems = [];
        } else if (command instanceof LoadPage) {
            this._page = command.doc;
            newState.items = command.doc.items;
            newState.background = command.doc.background;
            newState.unplacedGlobalItems = _intersection(this.appService._globalItems.map(i=>i.uid), command.doc.unplacedGlobalItems);
            newState.selectedItems = [];
            setTimeout(() => {
                this.backgroundInfo = command.doc.background;
            });
        }
        newState.boxes = newState.items.map(i=>i.content.box);
        return newState;
    }

    createCanvasContextMenu(
        step: number,
        gridImage: string,
        showRulers: boolean,
        guides: Guide[],
        clipboard: Item[]
    ): ContextMenu<CanvasContextMenuCommand> {
        const showGrid = gridImage
            ? new SimpleMenuItem(
                'Hide Grid',
                new HideGrid(),
                new MenuItemCssIcon('btl bt-th'))
            : new SimpleMenuItem(
                'Show Grid',
                new ShowGrid(),
                new MenuItemCssIcon('btl bt-th'));

        const rulers = guides.length === 0
            ? showRulers
                ? new SimpleMenuItem(
                    'Hide Rulers',
                    new HideRulers(),
                    new MenuItemImageIcon('/assets/images/canvas/ruler.png'))
                : new SimpleMenuItem(
                    'Show Rulers',
                    new ShowRulers(),
                    new MenuItemImageIcon('/assets/images/canvas/ruler.png'))
            : showRulers
                ? new DoubleMenuItem(
                    'Hide Rulers',
                    'Clear Guides',
                    new HideRulers(),
                    new ClearGuides(),
                    new MenuItemImageIcon('/assets/images/canvas/ruler.png'))
                : new SimpleMenuItem(
                    'Show Rulers',
                    new ShowRulers(),
                    new MenuItemImageIcon('/assets/images/canvas/ruler.png'));

        const gridSizeCtrl = new FormControl(step.toString());
        let prev = step.toString();
        const gridSizeUpdate = (x: string) => {
            if (x.match(/^\d?(?:\.\d?\d?)?$/)) {
                prev = x;
            } else {
                gridSizeCtrl.setValue(prev, { emitEvent: false });
            }

            const f = parseFloat(prev);
            return new SetGridStep(isNaN(f) ? 0 : f);
        };

        const paste = clipboard.length > 0
            ? [new SimpleMenuItem(
                'Paste',
                new Paste,
                new MenuItemCssIcon('btl bt-stop'))]
            : [];
        return [
            ...paste,
            showGrid,
            new InputMenuItem(
                'Grid Size',
                '',
                gridSizeCtrl,
                gridSizeUpdate,
                x => new SetGridStep(x !== '' ? parseFloat(x) : 0),
                new MenuItemCssIcon('btl bt-th')),
            rulers,
            new SimpleMenuItem(
                'Background',
                new Background(),
                new MenuItemCssIcon('btl bt-photo'))
        ];
    }

    createMoreContext(): ContextMenu<ItemContextMenuCommand> {
        const download = new SimpleMenuItem(
            'Download',
            new Download(),
            new MenuItemCssIcon('btl bt-circle-arrow-down bt-sm'));
        const simpleForm = new SimpleMenuItem(
            'Simple Form',
            new SimpleForm(),
            new MenuItemCssIcon('btl bt-edit bt-sm'));
        const simpleSurvey = new SimpleMenuItem(
            'Simple Survey',
            new SimpleSurvey(),
            new MenuItemCssIcon('btl bt-olist bt-sm'));
        return [download, simpleForm, simpleSurvey];
    }

    createItemContextMenu(item: Item): ContextMenu<ItemContextMenuCommand> {
        if (!item) return null;
        const copy = new SimpleMenuItem(
            'Copy',
            new Copy([item]),
            new MenuItemCssIcon('btl bt-copy bt-sm'));

        const paste = new SimpleMenuItem(
            'Paste',
            new Paste,
            new MenuItemCssIcon('btl bt-stop bt-sm'));

        const border = new SimpleMenuItem(
            'Border',
            new Border(),
            new MenuItemImageIcon('/assets/images/canvas/border.png'));

        const background = new SimpleMenuItem(
            'Background',
            new Background(),
            new MenuItemCssIcon('btl bt-photo'));

        const link = new SimpleMenuItem(
            'Link',
            new ShowAddLinkDialog(),
            new MenuItemCssIcon('btl bt-link'));

        const deleteItem = item && item.global && item.hf<=0 ?
            new SimpleMenuItem(
                'Remove from this page',
                new RemoveItems([item]),
                new MenuItemCssIcon('close-icon')) :
            new SimpleMenuItem(
                'Delete',
                new RemoveItems([item]),
                new MenuItemCssIcon('close-icon'));

        const caption = new SimpleMenuItem(
            'Caption',
            new Caption,
            new MenuItemCssIcon('btl bt-comment'));
        const group = new SimpleMenuItem(
            'Group',
            new GroupItems(this.currentState.selectedItems),
            new MenuItemCssIcon('btl bt-ellipsis-h bt-sm'));

        const ungroup = new SimpleMenuItem(
            'UnGroup',
            new GroupItems(this.currentState.selectedItems),
            new MenuItemCssIcon('btl bt-ellipsis-h bt-sm'));
        const order = new SubMenuItem<BringForward | BringToFront | SendBackward | SendToBack>(
            'Order',
            [
                new SimpleMenuItem('Bring Forward', new BringForward(item)),
                new SimpleMenuItem('Bring to Front', new BringToFront(item)),
                new SimpleMenuItem('Send Backward', new SendBackward(item)),
                new SimpleMenuItem('Send to Back', new SendToBack(item)),
            ],
            new MenuItemCssIcon('btl bt-ellipsis-v bt-sm'));
        const lock = item.locked
            ? new SimpleMenuItem(
                'Unlock',
                new Unlock(item),
                new MenuItemCssIcon('btl bt-lock-open bt-sm'))
            : new SimpleMenuItem(
                'Lock',
                new Lock(item),
                new MenuItemCssIcon('btl bt-lock bt-sm'));
        const colorBackground = new SimpleMenuItem(
            'Color Background',
            new ColorBackground(),
            new MenuItemCssIcon('btl bt-plus-square bt-sm'));

        const switchGlobal = item.global
            ? [
                new SimpleMenuItem(
                    'Show only on this page',
                    new SwitchGlobal(item, false),
                    new MenuItemCssIcon('fa fa-header')),
                new SimpleMenuItem(
                    'Remove from all Pages',
                    new RemoveFromAll([item]),
                    new MenuItemCssIcon('btl bt-book'))
            ] : [
                    new SimpleMenuItem(
                        'Show on all pages',
                        new SwitchGlobal(item),
                        new MenuItemCssIcon('btl bt-book-open'))
                ]

        const deleteContent = new SimpleMenuItem(
            'Delete all Content',
            new DeleteContent(item.hf),
            new MenuItemCssIcon('btb bt-times bt-sm'));

        switch (item.itemType) {
            case 'ImageItem':
            case 'TextItem':
                return [copy, paste, link, deleteItem, ...(this.currentState.selectedItems.length > 1 ? [group] : []), order, lock, caption, ...(item.hf == 0 ? switchGlobal : []), background, border];
            case 'ShapeItem':
            case 'ButtonItem':
            case 'NavItem':
            case 'VideoItem':
                return [copy, paste, deleteItem, ...(this.currentState.selectedItems.length > 1 ? [group] : []), ...(item.hf == 0 ? switchGlobal : []), order, lock];
            case 'AppointmentItem':
                return [copy, paste, deleteItem, background, border, order]
            case 'SocialItem':
            case 'EcommerceItem':
                return [deleteItem];
            case 'DonationItem':
            case 'EventSetupItem':
            case 'PhotoItem':
            case 'FormItem':
                return [copy, paste, deleteItem, order];
            case 'SlideShowItem':
            case 'GalleryItem':
                return [copy, paste, deleteItem, ...(this.currentState.selectedItems.length > 1 ? [group] : []), order, lock, ...(item.hf == 0 ? switchGlobal : []), background, border];
            case 'ItemGroup':
                return [copy, paste, deleteItem, ungroup, order, lock, ...(item.hf > 0 ? switchGlobal : [])];
            case 'HFItem':
                return [deleteContent, paste, order, lock, background, border];
            default:
                return [copy, paste, deleteItem, order];;
        }
    }

    /** Get canvas rect relative to the page. */
    canvasRectPage(): Rect {
        return elementRectPage(this.canvasElem);
    }

    /** Get canvas box in canvas own coordinate system */
    canvasBox(hf: number): Box {
        let ele = this.canvasElem;
        return new Box(0, ele.offsetWidth, 0, ele.offsetHeight);
    }

    /** Transform page coords to canvas coords */
    pageToCanvas(x: number, y: number, hf: number) {
        let ele = this.canvasElem;
        return pageToElement(ele, x, y);
    }

    /** Filter list of items keeping only those which cover specific point.
    * @param items All items.
    * @param x     X coordinate of the point in canvas space.
    * @param y     Y coordinate of the point in canvas space.
    */
    itemsAtPoint(items: Item[], x: number, y: number): Item[] {
        return items.filter(item => this.appService.rotatedPosition(item.content.box, this.getRotation(item)).isPointInside(x, y));
    }

    onCanvasMouseDown(event: MouseEvent) {
        if (!this.editable) return;
        this.itemMenu = false;
        this._canvasMouseDown.next(event);
    }

    onCanvasClick(event: MouseEvent, hf: number = 0) {
        event.stopPropagation();
        // this._deselectionAllItems.next();
    }

    openSkippingDialog() {
        let skippingWindow = createSkippingDialogWindow(this.windowService);
        skippingWindow.componentRef.instance.submit.pipe().subscribe(result => {
            this._setSkip.next(result);
        })
        skippingWindow.open();
    }

    onItemRotate(item: Item, event: number) {
        this.resizingCanvas(item, this.appService.rotatedPosition(item.content.box, event), true);
    }

    onItemDragStart(item: Item, dragStart: DragSession) {
        this.dragStartItemBox.top = item.content.box.top;
        this.dragStartItemBox.left = item.content.box.left;
        this.dragItemPrevTop = item.content.box.top;
    }

    onItemDrag(item: Item, box: Box) {
        this.resizingCanvas(item, box, false);

    }

    onItemDragEnd(item: Item, box: Box) {
        if (this.dragStartItemBox.top == box.top && this.dragStartItemBox.left == box.left) return;
        this._dragEnd.next([item, box]);
    }

    onItemRemove(item: Item) {
        this._itemRemoves.next([item]);
        this.itemRemoveEmit.emit(item);
    }

    onItemResize(item: Item, box: Box) {
        this.animation = false;
        this.resizingCanvas(item, box);
    }

    get footerViewHeight(): string{
        let rulerHeight = this._showRulers ? 32 : 0;
        return this._canvasBox.bottom - this._canvasScrollTop < this._containerHeight ? this._canvasBox.bottom - this._canvasScrollTop - 10 + rulerHeight + 'px' : this._containerHeight - 10 + rulerHeight + 'px'
    }

    getItemComponentBottom(ic: ItemComponent) {
        let ele = <HTMLElement>ic.elementRef.nativeElement;
        let angle = this.getRotation(ic.item);
        if (angle != 0) {
            return this.appService.rotatedPosition(new Box(ele.offsetLeft, ele.offsetLeft + ele.offsetWidth, ele.offsetTop, ele.offsetTop + ele.offsetHeight), this.getRotation(ic.item)).bottom;
        }
        else {
            return ele.offsetTop + ele.offsetHeight;
        }
    }

    resizingCanvas(item: Item, box: Box, rotating: boolean = false) {
        this.processing = true;

        if (!rotating && item.itemType != 'HFItem')
            box = this.appService.rotatedPosition(box, this.getRotation(item));

        if (this._itemComponents) {
            this.selectedItemComponents.forEach(i => {
                if (i.item != item) {
                    this.renderer.setElementStyle(i.elementRef.nativeElement, 'left', i.item.content.box.left + box.left - item.content.box.left + 'px');
                    this.renderer.setElementStyle(i.elementRef.nativeElement, 'top', i.item.content.box.top + box.top - item.content.box.top + 'px');
                }
            });
        }
        this.setCanvasSize();
    }

    setCanvasSize() {
        if (!this.resizable) return;
        let maxBottom = 0;
        if (this.resultItems.length > 0) {
            let itemComponents = this._itemComponents.toArray();
            maxBottom = _max([...itemComponents.map(i => this.getItemComponentBottom(i))]);
        }

        maxBottom = _max([maxBottom + this.canvasHPadding, this.backgroundImageHeight, this.minHeight]);
        if (maxBottom > this.minHeight && maxBottom > this._canvasBox.bottom - 5) {
            // this.canvasElem.style.height = maxBottom + 22 + 'px';
            this.renderer.setElementStyle(this.canvasElem, 'height', maxBottom + 'px');
            this._canvasBox = new Box(this._canvasBox.left, this._canvasBox.right, this._canvasBox.top, this.canvasElem.offsetHeight);
        }
        this.refreshView();
    }

    /**
    * Generate grid background for canvas with specific grid step.
    */
    public genGridImage(gridStep: number): string {
        const step = Math.round(gridStep);
        if (step <= 0 || isNaN(step)) { return ''; }

        const canvas = this.renderer.createElement(undefined, 'canvas') as HTMLCanvasElement;
        canvas.width = step;
        canvas.height = step;
        const ctx = canvas.getContext('2d');
        if (!ctx) { throw 'CanvasRenderingContext2D not supported.'; }

        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

        drawVerticalLine(image, canvas.width - 1, 0, canvas.height - 1, 204, 204, 255, 255);
        drawHorizontalLine(image, canvas.height - 1, 0, canvas.width - 1, 204, 204, 255, 255);

        ctx.putImageData(image, 0, 0);
        return canvas.toDataURL('image/png');
    }

    openLinkDialog(item: Item, linkMode: number = 0) { // linkMode: 0 => link, 1 => download
        let linkDialog = createLinkingDialogWindow(this.windowService, new LinkingForm(), linkMode);
        linkDialog.componentRef.instance.submit.subscribe(link => {
            this.openedDialog = false;
            linkDialog.destroy();
            this._setLink.next([item, link]);
        });
        linkDialog.componentRef.instance.close.subscribe(() => {
            this.openedDialog = false;
            linkDialog.destroy();
        });

        this.openedDialog = true;

        switch (item.itemType) {
            case 'TextItem':
                let textComps = <TextComponent[]>this._itemComponents.toArray()
                    .map(c => c.innerComponent)
                    .filter(c => c instanceof TextComponent);
                let dir = textComps.find(c => c.textEditorTinyMceDirective.enabled);
                if (dir) {
                    let textEditor = dir.textEditorTinyMceDirective;
                    textEditor.showLinkDialog();
                }
                break;
            case 'ImageItem':
                linkDialog.changeInputs(c => {
                    let content = <ImageItemContent>item.content;
                    if (content.image)
                        c.form.setLinkValue(
                            new LinkFormData(
                                new LinkSource('LinkSourceImage', content.image.location + '/' + content.image.name),
                                content.link
                            ));
                    else
                        c.form.setLinkValue(
                            new LinkFormData(
                                undefined,
                                content.link
                            ));
                });
                break;
            case 'ButtonItem':
            case 'ShapeItem':
                linkDialog.changeInputs(c => {
                    let content: any = item.content;
                    c.form.setLinkValue(
                        new LinkFormData(
                            new LinkSource('LinkSourceComponent', item),
                            content.link
                        ));
                });
                break;
            default:
                linkDialog.changeInputs(c => c.form.reset());
        }
        linkDialog.open();
    }

    openImageDialog(item: Item) {
        let imageEditorDialog = createImageEditorWindow(this.windowService);
        imageEditorDialog.componentRef.instance.newImage.subscribe((image: ImagePath) => {
            this.openedDialog = false;
            imageEditorDialog.destroy();
            this.setItemImage(item, image);
        });
        imageEditorDialog.componentRef.instance.close.subscribe(() => {
            this.openedDialog = false;
            imageEditorDialog.destroy();
            this._deselectionAllItems.next();
        });

        if ((item.content as ImageItemContent).image)
            imageEditorDialog.componentRef.instance.openImageInEditor((item.content as ImageItemContent).image);
        else
            imageEditorDialog.componentRef.instance.refresh();

        this.openedDialog = true;
        imageEditorDialog.open();
    }

    setItemImage(item: Item, image: ImagePath, desktop: boolean = false) {
        let img = new Image;
        img.onload = (event) => {
            let box: Box;
            let imgHeight = img.height;
            let imgWidth = img.width;
            let eleWidth = this.canvasElem.offsetWidth - this.canvasWPadding * 2;
            if (item)
                box = new Box(item.content.box.left, item.content.box.left + img.width, item.content.box.top, item.content.box.top + img.height);
            else
                box = new Box(this.canvasWPadding, img.width + this.canvasWPadding, 0, img.height);

            if (imgWidth > eleWidth) {
                img.width = eleWidth;
                box = new Box(this.canvasWPadding, img.width, 0, Math.floor(imgHeight * eleWidth/imgWidth));
            }
            else {
                let left = item ? item.content.box.left : this.canvasWPadding;
                if (left + imgWidth > eleWidth) {
                    left = (eleWidth - imgWidth) / 2;
                }
                box = new Box(left, left + imgWidth, item ? item.content.box.top : 0, item ? item.content.box.top + imgHeight : imgHeight);
            }
            if (desktop)
                this._addImageFromDesktop.next([image, box]);
            else
                this._setImage.next([item, image, box]);
        }
        img.src = imageUrl.imageSrcUrl(image);
    }

    addItemDialog(item: Item, dialog: (window: WindowService, item: Item) => any) {
        let selectedItem: Item = undefined;
        let service_item = this.items.find(i => this.ServiceItems.some(si => si == i.itemType));
        let survey_item = this.items.find(i => i.itemType == 'SurveyItem');

        if (item.itemType == 'EcommerceItem') {
            if (item.uid != '')
                selectedItem = item;
        } else if (['DonationItem', 'EventSetupItem', 'SurveyItem', 'PhotoItem', 'AppointmentItem'].some(i => i == item.itemType)) {
            if (survey_item) {
                item = survey_item;
                selectedItem = survey_item;
            } else if (service_item) {
                item = service_item;
                selectedItem = service_item;
            }
        } else if (this.selectedItem) {
            if (this.selectedItem.itemType == item.itemType) {
                selectedItem = this.selectedItem;
                item = _cloneDeep(selectedItem);
            } else {
                selectedItem = this.selectedItem;
            }
        }

        this.openItemDialog(item, dialog(this.windowService, item), selectedItem);
    }

    openItemDialog(item: Item, dialog: any, selectedItem: Item = undefined) {
        dialog.componentRef.instance.submit.subscribe((result: any) => {
            this.openedDialog = false;

            if (result.itemType == "EcommerceItem") { // if the result is a grid, all single ecommerce items are removed
                let items: Item[]
                items = this.items.filter(item => item.itemType == "EcommerceItem" && (selectedItem ? item != selectedItem : true));
                if (items.length > 0) {
                    this._itemRemoves.next(items);
                }
                //selectedItem = null;
            }

            this.changeDetectorRef.detach();

            item = item.setContent(result);

            if (selectedItem && selectedItem.itemType == item.itemType) {
                this._setItem.next([selectedItem, item]);
            } else {
                // set currentDocId for the new survey
                if (item.itemType == 'SurveyItem') {
                    this.appService.newPage();
                }
                this._addItem.next(item);
            }
            // setTimeout(() => {
            //     if (item.itemType == 'SurveyItem')
            //         this.store.dispatch({ type: 'ADD_SURVEY', payload: { survey: result.info.value, doc_id: this.appService._currentPage.uid } });
            // }, 10);

            dialog.destroy();
            this.changeDetectorRef.reattach();
        });

        dialog.componentRef.instance.close.subscribe(() => {
            this.openedDialog = false;
            dialog.destroy();
            this._deselectionAllItems.next();
        });

        this.openedDialog = true;
        dialog.open();
    }

    openBorderDialog() {
        let item: any;
        let borderInfo: BorderInfo;
        let survey_items = this.items.filter(item => item.itemType == 'SurveyItem');

        if (this.selectedItem) {
            item = this.selectedItem;
            if (_indexOf(this.hasBorderItems, item.itemType) < 0)
                return;
        } else if (survey_items.length > 0) {
            item = survey_items[0];
        } else {
            return;
        }

        if (item.content.borderInfo && item.content.borderInfo.value) {
            borderInfo = item.content.borderInfo.value as BorderInfo;
        }
        else {
            borderInfo = BorderInfo.empty();
        }

        let borderDialog = createBorderDialogWindow(this.windowService, borderInfo);
        borderDialog.componentRef.instance.submit.subscribe(result => {
            this.openedDialog = false;
            this._setBorder.next(result);
            borderDialog.destroy();
        });

        borderDialog.componentRef.instance.close.subscribe(result => {
            this.openedDialog = false;
            borderDialog.destroy();
        });

        this.openedDialog = true;
        borderDialog.open();
    }

    openBackgroundDialog() {
        let backInfo: BackgroundInfo;
        let dialogTitle: string;
        if (this.selectedItem) {
            let item: any = this.selectedItem;
            if (_indexOf(this.hasBackgroundItems, item.itemType) < 0)
                return;
            if (item.content.backInfo && item.content.backInfo.value) {
                backInfo = item.content.backInfo.value;
            }
            else {
                backInfo = BackgroundInfo.empty();
            }
            dialogTitle = 'BACKGROUND';
        } else {
            backInfo = this.currentState.background;

            if (!backInfo.backgroundImage) {
                backInfo.backgroundImage = BackgroundImageInfo.empty();
                backInfo.backgroundTiling = BackgroundTilingInfo.empty();
            }
            dialogTitle = 'BACKGROUND PAGE';
        }

        let backgroundDialog = createBackgroundDialogWindow(this.windowService, backInfo, dialogTitle, true);
        backgroundDialog.componentRef.instance.submit.subscribe(result => {
            this.openedDialog = false;
            this._setBackground.next(result);
            backgroundDialog.destroy();
        });

        backgroundDialog.componentRef.instance.close.subscribe(result => {
            this.openedDialog = false;
            backgroundDialog.destroy();
        });

        this.openedDialog = true;
        backgroundDialog.open();
    }

    clickCanvasTool(item: string, full: boolean = false) {
        let itemInfo: any;
        this._contextMore = false;

        switch (item) {
            case 'ClearDocument':
                this._clearDocument.next();
                break;
            case 'DeselectAllItems':
                this._deselectionAllItems.next();
                break;
            case 'Undo':
                if (this.isActiveUndo)
                    this._undo.next();
                break;
            case 'Redo':
                if (this.isActiveRedo)
                    this._redo.next();
                break;
            case 'Background':
                this.openBackgroundDialog();
                break;
            case 'Border':
                this.openBorderDialog();
                break;
            case 'More':
                this._contextMore = true;
                break;
            case 'ButtonItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'ButtonItem', new CommonItemContent<ButtonInfo>(Maybe.just(ButtonInfo.empty()))),
                    (window: WindowService, item: any) => createButtonDialogWindow(this.windowService, item.content)
                );
                break;
            case 'ImageItem':
                this._addImage.next();
                break;
            case 'Link':
                if (this.editingItem && this.editingItem.itemType == 'TextItem') {
                    let i = this._itemComponents.find(i=>i.item == this.editingItem);
                    if (i)
                        i._textComponent.textEditorTinyMceDirective.showLinkDialog();
                } else if (this.selectedItem && _indexOf(['ImageItem', 'ButtonItem', 'ShapeItem'], this.selectedItem.itemType) >= 0) {
                    this.openLinkDialog(this.selectedItem);
                }
                break;
            case 'GalleryItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'GalleryItem', new CommonItemContent<GalleryInfo>(Maybe.just(GalleryInfo.empty()))),
                    (window: WindowService, item: any) => createGalleryDialogWindow(this.windowService, item.content)
                );
                break;
            case 'NavItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'NavItem', new CommonItemContent<NavInfo>(Maybe.just(NavInfo.empty())).setMBox(new Box(280, 315, 10, 35))),
                    (window: WindowService, item: any) => createNavigationDialogWindow(this.windowService, item.content)
                );
                break;
            case 'ShapeItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'ShapeItem', new ShapeItemContent()),
                    (window: WindowService, item: Item) => createShapeDialogWindow(this.windowService, item.content)
                );
                break;
            case 'SlideShowItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'SlideShowItem', new CommonItemContent<SlideShowInfo>(Maybe.just(SlideShowInfo.empty()))),
                    (window: WindowService, item: any) => createSlideshowDialogWindow(this.windowService, item.content)
                );
                break;
            case 'TextItem':
                this._deselectionAllItems.next();
                this._addText.next(new Box(0, full ? this.canvasElem.offsetWidth - 30 : 300, 0, 80));
                break;
            case 'VideoItem':
                this.addItemDialog(
                    new Item(0, 0, '', 'VideoItem', new CommonItemContent<VideoInfo>(Maybe.just(VideoInfo.empty()))),
                    (window: WindowService, item: any) => createVideoDialogWindow(this.windowService, item.content)
                );
                break;
            case 'SingleTextItem':
                this._addItem.next(new Item(0, 0, '', 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo), new Box(0, 332, 0, 34))));
                break;
            case 'SingleText2Item':
                this._addItem.next(new Item(0, 0, '', 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(2)), new Box(0, 332, 0, 34))));
                break;
            case 'SingleDateItem':
                this._addItem.next(new Item(0, 0, '', 'SingleDateItem', new CommonItemContent<SingleDateInfo>(Maybe.just<SingleDateInfo>(new SingleDateInfo()), new Box(0, 332, 0, 34))));
                break;
            case 'CommentItem':
                this._addItem.next(new Item(0, 0, '', 'SingleTextItem', new CommonItemContent<SingleTextInfo>(Maybe.just<SingleTextInfo>(new SingleTextInfo(3)), new Box(0, 332, 0, 150))));
                break;
            case 'Required':
                if (this.selectedItem && _indexOf(['SingleTextItem', 'SingleText1Item', 'SurveySingleTextItem'], this.selectedItem.itemType) >= 0)
                    this._setReqiured.next();
                break;
            case 'SingleCheckBoxItem':
                this._addItem.next(new Item(0, 0, '', 'SingleCheckItem', new CommonItemContent<SingleCheckBoxInfo>(Maybe.just<SingleCheckBoxInfo>(new SingleCheckBoxInfo), new Box(0, 160, 0, 50))));
                break;
            case 'SingleChoiceItem':
                this._addItem.next(new Item(0, 0, '', 'MultiChoiceItem', new CommonItemContent<MultipleChoiceInfo>(Maybe.just<MultipleChoiceInfo>(new MultipleChoiceInfo), new Box(0, 200, 0, 200))));
                break;
            case 'MultiChoiceItem':
                itemInfo = Maybe.just(new MultipleChoiceInfo('check'));
                this._addItem.next(new Item(0, 0, '', 'MultiChoiceItem', new CommonItemContent<MultipleChoiceInfo>(itemInfo, new Box(0, 200, 0, 200))));
                break;
            case 'DropdownItem':
                itemInfo = Maybe.just(new DropdownInfo());
                this._addItem.next(new Item(0, 0, '', 'DropdownItem', new CommonItemContent<DropdownInfo>(itemInfo, new Box(0, 150, 0, 50))));
                break;
            case 'RatingStarsItem':
                this._addItem.next(new Item(0, 0, '', 'RatingItem', new CommonItemContent<RatingInfo>(Maybe.just<RatingInfo>(new RatingInfo), new Box(0, 300, 0, 80))));
                break;
            case 'RatingSliderItem':
                itemInfo = Maybe.just(new RatingInfo('slider'));
                this._addItem.next(new Item(0, 0, '', 'RatingItem', new CommonItemContent<RatingInfo>(itemInfo, new Box(0, 300, 0, 80))));
                break;
            case 'EndSurveyItem':
                this._addItem.next(new Item(0, 0, '', 'EndSurveyItem', new CommonItemContent<EndSurveyInfo>(Maybe.just<EndSurveyInfo>(new EndSurveyInfo), new Box(0, 300, 0, 100))));
                break;
            case 'MatrixOneChoiceItem':
                this._addItem.next(new Item(0, 0, '', 'MatrixChoiceItem', new CommonItemContent<MatrixChoiceInfo>(Maybe.just<MatrixChoiceInfo>(new MatrixChoiceInfo), new Box(0, 710, 0, 280))));
                break;
            case 'MatrixMultiChoiceItem':
                itemInfo = Maybe.just(new MatrixChoiceInfo('check'));
                this._addItem.next(new Item(0, 0, '', 'MatrixChoiceItem', new CommonItemContent<MatrixChoiceInfo>(itemInfo, new Box(0, 710, 0, 280))));
                break;
            case 'MatrixEditableDropdownItem':
                itemInfo = Maybe.just(new MatrixChoiceInfo('dropdown'));
                this._addItem.next(new Item(0, 0, '', 'MatrixChoiceItem', new CommonItemContent<MatrixChoiceInfo>(itemInfo, new Box(0, 710, 0, 280))));
                break;
            case 'RankDropdownItem':
                this._addItem.next(new Item(0, 0, '', 'RankItem', new CommonItemContent<RankInfo>(Maybe.just<RankInfo>(new RankInfo), new Box(0, 280, 0, 180))));
                break;
            case 'EnterDateItem':
                this._addItem.next(new Item(0, 0, '', 'DateItem', new CommonItemContent<DateInfo>(Maybe.just<DateInfo>(new DateInfo), new Box(0, 280, 0, 180))));
                break;
            case 'EnterTimeItem':
                this._addItem.next(new Item(0, 0, '', 'TimeItem', new CommonItemContent<TimeInfo>(Maybe.just<TimeInfo>(new TimeInfo), new Box(0, 280, 0, 180))));
                break;
            case 'SurveyCommentItem':
                this._addItem.next(new Item(0, 0, '', 'SurveyCommentItem', new CommonItemContent<SurveyCommentInfo>(Maybe.just<SurveyCommentInfo>(new SurveyCommentInfo), new Box(0, 300, 0, 180))));
                break;
            case 'SurveySingleTextItem':
                this._addItem.next(new Item(0, 0, '', 'SurveySingleTextItem', new CommonItemContent<SurveySingleTextInfo>(Maybe.just<SurveySingleTextInfo>(new SurveySingleTextInfo), new Box(0, 250, 0, 100))));
                break;
            case 'SurveySingleChoiceItem':
                this._addItem.next(new Item(0, 0, '', 'SurveyMultiChoiceItem', new CommonItemContent<SurveyMultiChoiceInfo>(Maybe.just<SurveyMultiChoiceInfo>(new SurveyMultiChoiceInfo), new Box(0, 280, 0, 210))));
                break;
            case 'SurveyMultiChoiceItem':
                itemInfo = Maybe.just(new SurveyMultiChoiceInfo('check'));
                this._addItem.next(new Item(0, 0, '', 'SurveyMultiChoiceItem', new CommonItemContent<SurveyMultiChoiceInfo>(itemInfo, new Box(0, 280, 0, 210))));
                break;
            case 'SurveyDropdownItem':
                itemInfo = Maybe.just(new SurveyMultiChoiceInfo('dropdown'));
                this._addItem.next(new Item(0, 0, '', 'SurveyMultiChoiceItem', new CommonItemContent<SurveyMultiChoiceInfo>(itemInfo, new Box(0, 280, 0, 210))));
                break;
            case 'SurveyMultiTextsItem':
                this._addItem.next(new Item(0, 0, '', 'SurveyMultiTextsItem', new CommonItemContent<SurveyMultiTextsInfo>(Maybe.just<SurveyMultiTextsInfo>(new SurveyMultiTextsInfo), new Box(0, 480, 0, 210))));
                break;
            case 'Skipping':
                // if (this.selectedItem && this.selectedItem.itemType == 'SurveyMultiChoiceItem') {
                //     let item: Item = this.selectedItem;
                //     let itemContent = item.content as CommonItemContent<SurveyMultiChoiceInfo>;
                //     let index = itemContent.info.value.values.findIndex(value => value != '');
                //     if (index >= 0)
                //         this.openSkippingDialog();
                // }
                break;
        }
    }

    activeContextMenu() {
        if (this.selectedItem && this.selectedItem.global) {
            return 'Remove from all Pages';
        }
        return null;
    }

    contextMenu() {
        if (this._contextMore) return this.createMoreContext();
        if (this.contextLEnableItem) {
            return this.createItemContextMenu(this.contextLEnableItem);
        }
        else if (this.itemMenu && this.rightSelectedItem) {
            return this.createItemContextMenu(this.selectedItem);
        }
        else if (this.currentState.selectedItems.length > 0 && this.itemMenu) {
            return this.createItemContextMenu(this.currentState.selectedItems[0]);
        }
        else {
            return this._contextMenu;
        }
    }

    contextMenuCommand(event: any) {
        this.contextLEnable = false;
        this._contextMore = false;
        if (event instanceof Download) {
            if (this.selectedItem && _indexOf(['ImageItem', 'ButtonItem', 'ShapeItem'], this.selectedItem.itemType) >= 0) {
                this.openLinkDialog(this.selectedItem, 1);
            }
        }
        else if (event instanceof GroupItems) {
            let keyEvent = new KeyboardEvent('keypress', { 'key': 'g', ctrlKey: true });
            this._keyboardEvent.next(keyEvent);
        }
        else if (event instanceof DeleteContent) {
            let items = this.items.filter(item => item.hf == event.hf && item.itemType != 'HFItem');
            this._itemRemoves.next(items);
        }

        else if (event instanceof Background)
            this.clickCanvasTool('Background');

        else if (event instanceof Background)
            this.clickCanvasTool('Border');

        else if (event instanceof SimpleForm)
            this.clickCanvasTool('SimpleFormItem');

        else if (event instanceof RemoveItems)
            this._itemRemoves.next(event.items);

        else if (this.selectedItem)
            this._itemContextMenuCommand.next([this.selectedItem, event]);

        else {
            this._canvasContextMenuCommand.next(event);
        }
    }

    contextMenuShown(event: any) {
        setTimeout(() => {
            this.contextLEnable = false;
            this.refreshView();
        });
    }

    contextMenuDisappear() {
        this.contextLEnableItem = null;
        this._contextMore = false;
        this.refreshView();
    }

    onContextLEnable(item: Item, xy: number[]) {
      this.contextLPageX = xy[0];
      this.contextLPageY = xy[1];
      this.contextLEnable = true;
      this.contextLEnableItem = item;
      this.refreshView();
    }

    isSurveyItem(item: Item) {
        return _indexOf(
            ['SurveyItem', 'RatingItem', 'RankItem', 'EndSurveyItem', 'MatrixChoiceItem', 'MatrixRatingItem', 'DateItem', 'TimeItem',
                'SurveySingleTextItem', 'SurveySingleCheckItem', 'SurveyCommentItem', 'SurveyMultiChoiceItem',
                'SurveyMultiTextsItem'], item.itemType) >= 0 ? true : false;
    }

    isQuestion(tool: string) {
      return _indexOf(
        ['SurveySingleChoiceItem', 'SurveyMultiChoiceItem', 'SurveyDropdownItem', 'SurveySingleTextItem',
        'RatingStarsItem', 'RatingSliderItem', 'RankDropdownItem',
        'EndSurveyItem','EnterDateItem','EnterTimeItem', 'SurveyCommentItem',
        'MatrixOneChoiceItem','MatrixMultiChoiceItem','MatrixEditableDropdownItem',
        'SurveyMultiTextsItem'], tool) >= 0 ? true : false;
    }

    onFileDrop(item: Item, event: File) {
        this.refreshView(true, 'Uploading...');
        switch (item.itemType) {
            case 'ImageItem':
                this.callingAPI = this.appService.uploadImages([event]).subscribe(
                    event => {
                        switch (event.type) {
                            case HttpEventType.Sent:
                                break;
                            case HttpEventType.UploadProgress:
                                // Compute and show the % done:
                                if (this.loadingComponent)
                                    this.loadingComponent.set(Math.min(event.loaded/event.total * 100, 98));
                                break;
                            case HttpEventType.Response:
                                if (event.body) {
                                    if (_get(event, 'body.tuid')) {
                                      localStorage.setItem('tuid', _get(event, 'body.tuid'))
                                    }
                                    const img = _get(event, ['body', 'urls', 0]);
                                    let s = event.body['urls'][0];
                                    this.setItemImage(item, s as ImagePath);
                                    this.refreshView();
                                }
                                break;
                        }
                    },
                    error => {
                        console.log(error);
                        // this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
                    },
                    () => {}
                );
                break;
        }
    }

    onDragOver(e) {
        let files = e.dataTransfer.files;
        if (!files || files.length == 0) return;
        e.preventDefault();
        this.canvasElem.style.opacity = '0.5';
    }
    onDragEnter(e) {
        let files = e.dataTransfer.files;
        if (!files || files.length == 0) return;
        e.preventDefault();
    }
    onDragLeave(e) {
        let files = e.dataTransfer.files;
        if (!files || files.length == 0) return;
        e.preventDefault();
        this.canvasElem.style.opacity = '1';
    }
    onDrop(e) {
        let files = e.dataTransfer.files;
        if (!files || files.length == 0) return;
        e.preventDefault();
        this.canvasElem.style.opacity = '1';
        if (files.length > 0 && files[0].type.indexOf('image')>=0) {
            this.uploadeImages([files[0]]);
        }
    }

    /** Checks if event target is canvas or descendant of an <item> element. */
    _targetIsCanvasOrItem(event: Event, hf: number = 0): boolean {
        let ele = this.canvasElem;
        return ancestors(event.target as HTMLElement).some(x => x === ele) || ancestors(event.target as HTMLElement).some(x => x.localName === 'item');
    }

    /** Checks if event target is descendant of an <item> element. */
    _targetIsItem(event: Event): boolean {
        return ancestors(event.target as HTMLElement).some(x => x.localName === 'item');
    }

    /** Move box to the center of the visible area of the canvas. */
    public _centerBox(item: Item, hf: number) {
        let x = (this.canvasElem.offsetWidth - item.content.box.width()) / 2;
        let y = 20;
        y = _max([this.canvasScrollElem.scrollTop + 20 + this.extraScrollTop, y]);
        return item.content.box.moveTo(Math.round(x), Math.round(y));
    }

    /** Find a free place for an item. */
    public _findPlace(box: Box, items: Item[], searchStepX: number, searchStepY: number, hf: number = 2): Box {
        const fItems = items.filter(item => item.hf == hf);
        const go: (_box: Box, _items: Item[]) => Box = (_box: Box, _items: Item[]) => {
            let box: Box;
            if (!_items.find(item => item.content.box.left === _box.left && item.content.box.top === _box.top)) {
                box = _box;
            } else {
                // If the place is occupied move by an offset.
                let ele = this.canvasElem;
                const dx =
                    _box.right + searchStepX <= this.canvasBox(hf).right && _box.left + searchStepX >= 0
                        ? searchStepX
                        : 0;

                const targetBottom = _box.bottom + searchStepY;
                if (targetBottom > this.canvasBox(hf).bottom) {
                    ele.style.height = targetBottom + 5 + 'px';
                    this._canvasBox = new Box(this._canvasBox.left, this._canvasBox.right, this._canvasBox.top, this.canvasElem.offsetHeight);
                }
                box = go(_box.moveBy(dx, searchStepY), _items);
            }

            if (_box.width() > this.canvasElem.offsetWidth - this.canvasWPadding * 2) {
                return new Box(this.canvasWPadding, this.canvasElem.offsetWidth - this.canvasWPadding, _box.top, _box.bottom);
            } else {
                return box;
            }
        };
        return go(box, fItems);
    }

    onItemMouseDown(item: Item, event: MouseEvent) {
        if (!this.editable) return;
        this._itemMouseDown.next([item, event]);
    }

    onItemClick(item: Item, event: MouseEvent) {
        if (!this.editable) return;
        this._itemClick.next([item, event]);
        if (!this.contextLEnable)
            event.stopPropagation();
    }

    onStartEditItem(item: Item) {
        switch (item.itemType) {
            case 'ImageItem':
                this.openImageDialog(item);
                break;
            case 'ButtonItem':
            case 'SlideShowItem':
            case 'ShapeItem':
            case 'GalleryItem':
            case 'VideoItem':
            case 'SocialItem':
            case 'FormItem':
                this.clickCanvasTool(item.itemType);
        }
    }

    draggable(item: Item) {
        if (this.isSurveyItem(item) || this.isQuestion(item.itemType)) return false;
        if (this.currentState.selectedItems.indexOf(item) < 0 || this.editingItem || item.locked)
            return false;
        return true;
    }

    rotatable(item: Item): boolean {
      if (this.isSurveyItem(item) || this.isQuestion(item.itemType)) return false;
        if (this.selectedItem !== item || this.editingItem || item.locked || _indexOf(['ShapeItem', 'ButtonItem', 'ImageItem'], item.itemType) < 0)
            return false;
        return true;
    }

    resizable(item: Item, isLine: boolean = false) {
      if (this.isSurveyItem(item) || this.isQuestion(item.itemType)) return false;
        if (this.selectedItem !== item  || item.locked)
            return false;
        if (!isLine) {
            if (_indexOf(['ItemGroup', 'SurveyItem', 'DonationItem', 'EventSetupItem'], item.itemType) >= 0)
                return false;
            return true;
        }
        else {
            return (item.itemType != 'ShapeItem' || (item.content as ShapeItemContent).info.value.shapeType.indexOf('line') == -1);
        }
    }


    showResizeBox(item: Item) {

	}
	
	onOutLink(e) {

	}

	dropped(e) {

	}

    /** set min-height of item */
    resizeMinHeight(item: Item) {
        let height = 30;
        switch (item.itemType) {
            case 'NavItem':
                height = (item.content as CommonItemContent<NavInfo>).info.value.minHeight;
                break;
            default:

        }
        return height;
    }

    /** set min-width of item */
    resizeMinWidth(item: Item) {
        let width = 30;
        // switch(item.itemType) {
        //     case 'NavItem':
        //         width = (item.content as NavItemContent).info.value.minWidth;
        //         break;
        //     default:

        // }
        return width;
    }

    uploadeImages(files: File[]) {
        if (files[0].type.indexOf('image') >= 0) {
            this.refreshView(true, 'Uploading');
            this.changeDetectorRef.detectChanges();
            this.callingAPI = this.appService.uploadImages(files).subscribe(
                event => {
                    switch (event.type) {
                        case HttpEventType.Sent:
                            // console.log(`Uploading file "${index}" of size ${f.size}.`);
                            break;
                        case HttpEventType.UploadProgress:
                            if (this.loadingComponent)
                                this.loadingComponent.set(Math.min(event.loaded/event.total * 98));
                            break;
                        case HttpEventType.Response:
                            const tuid = _get(event, 'body.tuid');
                            const img = _get(event, ['body', 'urls', 0]);

                            if (tuid) {
                                localStorage.setItem('tuid', _get(event, 'body.tuid'));
                            }
                            if (img) {
                                this.setItemImage(null, img, true);
                            } else {
                                this.refreshView();
                            }
                            break;
                    }
                },
                error => {
                    console.log(error);
                    this.alertService.playToast('Failed', `There is an error while uploading ${files[0].name}. Try again`, 1);
                    this.refreshView();
                },
                () => {
                    this.refreshView();
                }
            );
        }
        if (files[0].type.indexOf('video') >= 0) {
            this.refreshView(true, 'Uploading');
            this.callingAPI = this.appService.uploadImages(files).subscribe(
                event => {
                    switch (event.type) {
                        case HttpEventType.Sent:
                            break;
                        case HttpEventType.UploadProgress:
                            if (this.loadingComponent)
                                this.loadingComponent.set(Math.min(event.loaded/event.total * 98));
                            break;
                        case HttpEventType.Response:
                            if (this.loadingComponent)
                                this.loadingComponent.complete();
                            if (event.body) {
                                let info = VideoInfo.empty();
                                info.url = event.body['urls'][0];
                                let item = new Item(0, 0, '', 'VideoItem', new CommonItemContent<VideoInfo>(Maybe.just(info)));
                                this._addItem.next(item);
                            } else {
                                this.refreshView();
                            }
                            break;
                    }
                },
                error => {
                    console.log(error);
                    this.alertService.playToast('Failed', `There is an error while uploading ${files[0].name}. Try again`, 1);
                    this.refreshView();
                },
                () => {
                }
            );
        }
    }

    onCancelled() {
        this.cancelled = true;
        if (this.callingAPI)
            this.callingAPI.unsubscribe();
        if (this.viewInited)
          this.refreshView();
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (this.openedDialog) return;
        if ((event.ctrlKey && [67, 89, 90].indexOf(event.keyCode) >= 0 || event.keyCode > 36 && event.keyCode < 41 || event.keyCode == 46) && !this.editingItem && (this.selectedItem || this.currentState.selectedItems.length > 0) ||
            event.ctrlKey && event.keyCode == 86 && this._clipboard && !this.editingItem) {
            this._keyboardEvent.next(event);
        }
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize(event: UIEvent) {
        this._windowResize.next(event);
    }

    @HostListener('document:click', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (!ancestors(event.target as HTMLElement).some(x => x.localName === 'page-canvas' || x.localName === 'canvas-tools' || $(x).hasClass('k-window') || $(x).hasClass('mce-tinymce') || $(x).hasClass('mce-container') || $(x).hasClass('nav-main'))) {
            this._nonEditingItem.next();
        }
    }

    @HostListener('document:contextmenu', ['$event'])
    oncontextmenu(event: MouseEvent) {
        if (!ancestors(event.target as HTMLElement).some(x => x.localName === 'page-canvas' || x.localName === 'canvas-tools' || $(x).hasClass('k-window') || $(x).hasClass('mce-tinymce') || $(x).hasClass('mce-container'))) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    refreshView(loading: boolean = false, text: string = 'Saving...') {
        if (!this.viewInited) return;
        this.loading = loading;
        this.loadingText = text;
        this.changeDetectorRef.detectChanges();
        //this.changeDetectorRef.markForCheck();
    }

    ngOnDestroy() {
        this.viewInited = false;
        if (this.subs) {
            this.subs.forEach(s => s.unsubscribe());
        }
    }
}
