import {
    ViewChild, Component, ElementRef, ChangeDetectorRef, Input, Output, OnInit, OnDestroy, EventEmitter
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { InvitationInfo, Page, CommonItemContent, Item, Link } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

@Component({
    moduleId: module.id,
    selector: 'reply',
    templateUrl: 'reply.component.html',
    styleUrls: ['reply.component.css']
})
export class ReplyComponent implements OnInit, OnDestroy {
    @Input('info') info: InvitationInfo = new InvitationInfo();
    @Output('close') close = new EventEmitter<void>();    

    private _elem: HTMLElement;    
    public _dispMode: number = 0; // 1: display Name and Email
    private _subs: Rx.Subscription[] = [];

    constructor(        
        private _changeDetector: ChangeDetectorRef,
        private _windowService: WindowService,        
        private _elementRef: ElementRef        
    ) { }   

    ngOnInit() {
        this.info.showComing
    }

    onNotYou() {
        this._dispMode = 1;
    }

    onClose() {
        if (this._dispMode == 1) {
            this._dispMode = 0;
        }
        else {
            this.close.emit();
            this._dispMode = 0;
        }        
    }

    onReply() {
        this.close.emit();
        this._dispMode = 0;
    }

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }
}
