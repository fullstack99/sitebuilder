// import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
//          ViewChild, ElementRef
//        } from '@angular/core';
// import * as Rx from 'rxjs/Rx';
// import { FormControl } from '@angular/forms';
// import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
// import { FontsService, Font, SortFonts, FontCategory } from './fonts.service';
// import { WindowService, DialogWindow } from '@app-common/window/window.service';

// export { WindowService, DialogWindow } from '@app-common/window/window.service';
// export { FontsService, Font, SortFonts, FontCategory } from './fonts.service';

// /** */
// export function createFontPickerDialogWindow(
//     windowService: WindowService
// ): DialogWindow<FontPickerDialogComponent> {
//     return windowService.create<FontPickerDialogComponent>(
//         FontPickerDialogComponent,
//         {
//             width: 612,
//             height: 622,
//             modal: true,
//             draggable: false,
//             resizable: false,
//             scrollable: false,
//             visible: false,
//             title: false
//         }
//     )
//     .changeInputs((comp, window) => comp.close.subscribe(() => window.close()));
// }

// interface FontListItem {
//     font  : Font;
//     loaded: boolean;
// }

// // ---------------------------------------------------------------
// // Component
// // ---------------------------------------------------------------
// @Component({
//     moduleId: module.id,
//     templateUrl: 'font-picker.component.html',
//     styleUrls: ['font-picker.component.css']
// })
// export class FontPickerDialogComponent implements OnInit, OnDestroy {
//     @Output('close') close = new EventEmitter<Font[]>();

//     @ViewChild('fontList') public _fontListElemRef: ElementRef;
//     get _fontListElem(): HTMLElement { return this._fontListElemRef.nativeElement; }

//     @ViewChild('myFonts') public _myFontsElemRef: ElementRef;
//     get _myFontsElem(): HTMLElement { return this._myFontsElemRef.nativeElement; }

//     // ---------------------------------------------------------------
//     public _fontListScroll = new Rx.Subject<UIEvent>();    
//     public _removeMyFont   = new Rx.Subject<Font>();

//     // ---------------------------------------------------------------
//     public _fontList        : Font[] = [];
//     public _filteredfontList: Font[] = [];
//     public _loadedFonts     : Font[] = [];    
//     public _myFonts         : Font[] = [];

//     // ---------------------------------------------------------------
//     public _sortByCtrl   = new FormControl('popularity');
//     public _categoryCtrl = new FormControl('all');
//     public _searchCtrl   = new FormControl('');

//     // ---------------------------------------------------------------
//     private active_view: boolean = true;
//     private subs: Rx.Subscription[];

//     // ---------------------------------------------------------------
//     constructor(
//         public _changeDetector: ChangeDetectorRef,
//         public _fontsService: FontsService,
//         private _windowService: WindowService
//     ) {}

//     ngOnInit() {      

//         const scrollTop = this._fontListScroll
//             .map(() => this._fontListElem.scrollTop)
//             .publish().refCount();

//         const scrollBottom = scrollTop
//             .map(top => this._fontListElem.scrollHeight
//                 - top - this._fontListElem.offsetHeight)
//             .publish().refCount();

//         const sortFonts = this._sortByCtrl.valueChanges
//             .startWith('popularity')
//             .map(s =>
//                 this._fontsService.getFontList(s)
//                     .concat(Rx.Observable.never<Font[]>()))
//             .switch();

//         this.subs = [            
//             scrollBottom.subscribe(r=> {
//                 if (r <= this._fontListElem.offsetHeight / 10) {
//                     const toLoad = this._filteredfontList.slice(this._loadedFonts.length, this._loadedFonts.length + 50);
//                     this._fontsService.loadFonts(toLoad.map(f => f.family));
//                     this._loadedFonts = this._loadedFonts.concat(toLoad);
//                     if (this.active_view)
//                         this._changeDetector.detectChanges();
//                 }
//             }),

//             Rx.Observable.merge(
//                 this._categoryCtrl.valueChanges,
//                 this._searchCtrl.valueChanges,
//                 sortFonts
//             ).subscribe(r=> {
//                 this.getFilteredFontList();
//             }),           

//             this._removeMyFont.subscribe(r=> {
//                 this._myFonts = this._myFonts.filter(f=>f!==r);
//                 if (this.active_view) {
//                     this._changeDetector.detectChanges();
//                     this._myFontsElem.scrollTop = this._myFontsElem.scrollHeight;
//                 } 
//             }),                    
//         ];
//         this.getFilteredFontList();
//     }

//     getFilteredFontList() {
//         const cat = this._categoryCtrl.value;
//         const search = this._searchCtrl.value;
//         const fs = cat === 'all' ? this._fontList : this._fontList.filter(f => f.category === cat);
//         this._filteredfontList = search === '' ? fs : fs.filter(f => new RegExp(search, 'i').test(f.family));
//         this._fontListElem.scrollTop = 0;

//         const toLoad = this._filteredfontList.slice(this._loadedFonts.length, this._loadedFonts.length + 50);
//         this._fontsService.loadFonts(toLoad.map(f => f.family));
//         this._loadedFonts = this._loadedFonts.concat(toLoad);
//         if (this.active_view)
//             this._changeDetector.detectChanges();
//     }

//     openFeedbackDialog() {
//         createFeedbackDialogWindow(this._windowService, 'f.g.111').open();
//     }

//     onClose() {
//         this._fontsService.setMyFonts(this._myFonts);
//         this.close.emit(this._myFonts);
//     }

//     ngOnDestroy() {
//         this.active_view = false;
//         this.subs.forEach(s => s.unsubscribe());
//     }
// }


import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
    ViewChild, ElementRef
  } from '@angular/core';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { FormControl } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { FontsService, Font, SortFonts, FontCategory } from '@app-dialogs/font-picker/fonts.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';
export { FontsService, Font, SortFonts, FontCategory } from '@app-dialogs/font-picker/fonts.service';

/** */
export function createFontPickerDialogWindow(
    windowService: WindowService
): DialogWindow<FontPickerDialogComponent> {
    return windowService.create<FontPickerDialogComponent>(
    FontPickerDialogComponent,
    {
        width: 612,
        height: 622,
        modal: true,
        draggable: false,
        resizable: false,
        scrollable: false,
        visible: false,
        title: false
    }
    ).changeInputs((comp, window) => comp.close.subscribe(() => window.close()));
}

interface FontListItem {
    font  : Font;
    loaded: boolean;
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'font-picker.component.html',
    styleUrls: ['font-picker.component.css']
})
export class FontPickerDialogComponent implements OnInit, OnDestroy {
    @Output('close') close = new EventEmitter<Font[]>();

    @ViewChild('fontList') public _fontListElemRef: ElementRef;
    get _fontListElem(): HTMLElement { return this._fontListElemRef.nativeElement; }

    @ViewChild('myFonts') public _myFontsElemRef: ElementRef;
    get _myFontsElem(): HTMLElement { return this._myFontsElemRef.nativeElement; }

    // ---------------------------------------------------------------
    public _fontListScroll = new Subject<UIEvent>();
    public _addMyFont      = new Subject<Font>();
    public _removeMyFont   = new Subject<Font>();

    // ---------------------------------------------------------------
    public _fontList        : Font[] = [];
    public _filteredfontList: Font[] = [];
    public _loadedFonts     : Font[] = [];
    public _fontCategory    : FontCategory | 'all' = 'all';
    public _searchFont      : string = '';
    public _myFonts         : Font[] = [];

    // ---------------------------------------------------------------
    public _sortByCtrl   = new FormControl('popularity');
    public _categoryCtrl = new FormControl('all');
    public _searchCtrl   = new FormControl('');

    // ---------------------------------------------------------------
    private active_view: boolean = true;
    private subs: Subscription[];

    // ---------------------------------------------------------------
    constructor(
        public _changeDetector: ChangeDetectorRef,
        public _fontsService: FontsService,
        private _windowService: WindowService
    ) {}

    ngOnInit() {
        const fontCategory = Observable.merge(
            Observable.of('all'),
            this._categoryCtrl.valueChanges
        );

        const searchFont  = Observable.merge(
            Observable.of(''),
            this._searchCtrl.valueChanges
        );

        const fontList = Observable.merge(
            Observable.of(<Font[]>[]),
            this._sortByCtrl.valueChanges
                .startWith('popularity')
                .map(s =>
                    this._fontsService.getFontList(s)
                        .concat(Observable.never<Font[]>()))
                .switch()
        );
            
        const filteredfontList = fontList.combineLatest(
            fontCategory,
            searchFont            
        ).map(([fonts, cat, search]) => {            
                const fs = cat === 'all' ? fonts : fonts.filter(f=>f.category === cat);
                return search === ''
                    ? fs : fs.filter(f => new RegExp(search, 'i').test(f.family));
            });

        const scrollTop = this._fontListScroll
            .map(() => this._fontListElem.scrollTop)
            .publish().refCount();

        const scrollBottom = scrollTop
            .map(top => this._fontListElem.scrollHeight
                - top - this._fontListElem.offsetHeight)
            .publish().refCount();           

        this.subs = [
            filteredfontList.subscribe(value => {
                this._filteredfontList = value;
                const toLoad = this._filteredfontList.slice(0, 50);
                this._fontsService.loadFonts(toLoad.map(f => f.family));
                this._loadedFonts = toLoad;
                this._fontListElem.scrollTop = 0;
                if (this.active_view)
                    this._changeDetector.detectChanges() 
            }),

            fontList.subscribe(value=> {
                this._fontList = value;
            }),
            
            scrollBottom.subscribe((s) => {
                if (s <= this._fontListElem.offsetHeight / 10) {
                    const toLoad = this._filteredfontList.slice(this._loadedFonts.length, this._loadedFonts.length + 50);
                    this._fontsService.loadFonts(toLoad.map(f => f.family));
                    this._loadedFonts = [...this._loadedFonts, ...toLoad];
                    if (this.active_view)
                        this._changeDetector.detectChanges()
                }
            }),           

            this._addMyFont.subscribe(r=> {
                if (this._myFonts.findIndex(f=>f.family === r.family) < 0) {
                    this._myFonts.push(r);
                }
                if (this.active_view) {
                    this._changeDetector.detectChanges();
                    this._myFontsElem.scrollTop = this._myFontsElem.scrollHeight;
                }
            }),
            this._removeMyFont.subscribe(r=> {
                this._myFonts = this._myFonts.filter(f=> f !== r);
                if (this.active_view)
                    this._changeDetector.detectChanges();
            })
        ];
    }

    openFeedbackDialog() {
        createFeedbackDialogWindow(this._windowService, 'f.g.111').open();
    }

    onClose() {
        this._fontsService.setMyFonts(this._myFonts);
        this.close.emit(this._myFonts);
    }

    ngOnDestroy() {
        this.active_view = false;
        this.subs.forEach(s => s.unsubscribe());
    }
}
