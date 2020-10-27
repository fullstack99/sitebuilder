import {
    Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
    ViewChild, ElementRef, HostListener, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';
import { Contact } from '@app-models/email-list';


/** */
export function createAddListWindow(
    windowService: WindowService,
    emailList: Array<string>,
    checkedEmailList: Array<string> = []
): DialogWindow<AddListComponent> {
    return windowService.create<AddListComponent>(
        AddListComponent,
        {
            width: 250,
            position: {
                left: 'calc(50% - 126px)',
                top: 'calc(50% - 163px)'
            },
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => {
        comp.emailList = emailList;
        comp.checkedEmailList = checkedEmailList;
        comp.isDialog = true;
        comp.close.subscribe(() => window.close());       
    });
}

export interface AddListValue{
    list: Array<string>;    
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
    moduleId: module.id,
    selector: 'add-list',
    templateUrl: 'add-list.component.html',
    styleUrls: ['add-list.component.css']
})
export class AddListComponent implements OnInit, OnDestroy {
        
    @Input() emailList: Array<string> = [];
    @Input() checkedEmailList: Array<string> = [];
    @Input() isDialog: boolean = false;

    @Output('close') close = new EventEmitter<void>();
    @Output('submit') submit = new EventEmitter<AddListValue>();

    newEmailList: Array<string> = [];  

    private subs: Rx.Subscription[] = [];

    constructor(
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {        
        let list = lodash.uniq([...this.emailList, ...this.checkedEmailList]);
        this.newEmailList = lodash.clone(list);
        this.newEmailList.push('');
        this.subs = [
        ];
    }

    isSelected(str: string) {
        return this.checkedEmailList.indexOf(str) >= 0;
    }

    onCheck(event: any, index: number) {
        if (event.srcElement['checked'] === true && this.checkedEmailList.indexOf(this.newEmailList[index]) < 0)
            this.checkedEmailList.push(this.newEmailList[index]);
        else if (event.srcElement['checked'] === false) {
            this.checkedEmailList = this.checkedEmailList.filter(i=>i != this.newEmailList[index]);
        }        
        this.onSubmit();
    }

    onInput(event: any, index: number) {        
        this.newEmailList[index] = event.target.value;
    }   

    onMore() {
        this.changeDetector.detectChanges();
        this.newEmailList.push('');
        this.changeDetector.detectChanges();               
    }

    onRemove() {        
        this.changeDetector.detectChanges();
    }

    onSubmit() {        
        this.submit.emit({
            list: this.checkedEmailList
        });
    }

    onClose() {
        this.close.emit();
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}
