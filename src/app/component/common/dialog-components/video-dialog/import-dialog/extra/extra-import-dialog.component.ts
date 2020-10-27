import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from "@ngrx/store";
import { FormControl, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createExtraSearchDialogWindow } from './extra-search/extra-search-dialog.component';
import { ExtraLoginComponent, createExtraLoginWindow } from './extra-account/extra-account-login.component'
import { ExtraAPI } from "./extra-search/shared/extra-search.service";
import * as youtubeReducer from '@app/stores/reducers/videos/youtube.reducer';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


/** */
export function createExtraImportDialogWindow(
    windowService: WindowService,
    feedbackcode: string = '',
    source: number=2
): DialogWindow<ExtraImportDialogComponent> {
    return windowService.create<ExtraImportDialogComponent>(
        ExtraImportDialogComponent,
        {
            width: 320,
            height: 300,
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => {
        comp.source=source;
        comp.feedbackcode = feedbackcode;
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
        comp.window = window;
    });
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    templateUrl: 'extra-import-dialog.component.html',
    styleUrls: ['extra-import-dialog.component.css']
})
export class ExtraImportDialogComponent implements OnInit, OnDestroy, OnChanges {    
    
    @Input() source: number = 2; // 2: youtube, 3: vimeo
    @Input() feedbackcode: string = '';

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<string>();
    @Output() window: DialogWindow<ExtraImportDialogComponent>;    

    public dispStr: string[] = ['', '', 'YouTube', 'Vimeo'];
    public videoUrl = new FormControl('', [Validators.required]);
    private youtubeUser: any;
    private subs: Rx.Subscription[] = [];

    constructor(        
        private extraAPI: ExtraAPI,
        private store:Store<youtubeReducer.YoutubeUserProfileState>,
        private changeDetector: ChangeDetectorRef,
        private windowService: WindowService        
    ) {}

    ngOnInit() {    
        this.subs = [
            this.store.select(youtubeReducer.getUserProfile)
                .subscribe((data) => {
                    if (data && data.name) {
                        this.youtubeUser = data;
                        setTimeout(() => {
                            this.openSearchExtra(null, true);
                        });                        
                    }
                    else {
                        this.youtubeUser = undefined;
                        // this.extraAPI.oAuthSignInYouTube('googleSignInBtn');
                    }
                }),
            this.videoUrl.valueChanges.subscribe(res => {
                this.changeDetector.detectChanges();
            })
        ];        
    }

    ngOnChanges(changes: SimpleChanges) {
        this.changeDetector.detectChanges();
    }

    openSearchExtra(event: MouseEvent, fromAccount:boolean = false) { //1: from MyVideos
        if (this.source == 2) {
            if (this.youtubeUser || !fromAccount) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                let extraSearchDialog = createExtraSearchDialogWindow(this.windowService, this.source, fromAccount);
                extraSearchDialog.componentRef.instance.submit.subscribe(url => {
                    this.submit.emit(url);
                    extraSearchDialog.destroy();
                });
                extraSearchDialog.componentRef.instance.close.subscribe(url => {                    
                    extraSearchDialog.destroy();
                });
                extraSearchDialog.open();
            }
        }
        else {

        }        
    }

    onAdd() {
        if (this.videoUrl.invalid) return;
        this.submit.emit(this.videoUrl.value);
    }

    openExtraLogin() {
        let extraLoginDialog: DialogWindow<ExtraLoginComponent>;
        extraLoginDialog = createExtraLoginWindow(this.windowService);
        extraLoginDialog.open();
    }

    openFeedbackDialog() {
        createFeedbackDialogWindow(this.windowService, this.feedbackcode).open();
    }

    onClose() {
        this.close.emit();
    }   

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());        
    }    
}
