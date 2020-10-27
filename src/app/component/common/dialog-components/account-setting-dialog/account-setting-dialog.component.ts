import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ViewChild, 
    ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Steps } from '@app-ui/steps/steps.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { User } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createAccountSettingDialogWindow(
    windowService: WindowService,
    info: User = new User,
    activeStepIndex = 0,	
): DialogWindow<AccountSettingDialogComponent> {
	return windowService.create<AccountSettingDialogComponent>(
		AccountSettingDialogComponent,
		{
            width: 380,            
            position: {
				left: 'calc(50% - 190px)',
				top: '20px'
            },
            maxHeight: 800,
            modal: true,
            draggable: false,
            resizable: true,
            scrollable: false,
            visible: false,
            title: false
		}
	).changeInputs((comp, window) => {
        comp.info = info;
        comp.activeStepIndex = activeStepIndex;        
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
    moduleId: module.id,
    selector: 'account-setting',
    templateUrl: './account-setting-dialog.component.html',
    styleUrls: ['./account-setting-dialog.component.css']    
})

export class AccountSettingDialogComponent implements OnInit, AfterViewInit, OnDestroy{

    @Input() info: User = new User;    
    @Input() activeStepIndex = 0;    

    @Output() submit = new EventEmitter<User>();
    @Output() close = new EventEmitter<void>();    

    steps: Steps[] = [
        { name: 'Account', valid: false, touched: false, visited: false },
        { name: 'Profile', valid: false, touched: false, visited: false }        
    ];
    errorMessage: string = '';

    private originalInfo: User;

    constructor(        
        private changeDetector: ChangeDetectorRef,        
        private windowService: WindowService
    ) {
    }

    ngOnInit() {        
        this.originalInfo = lodash.cloneDeep(this.info);        
        this.steps[0].visited = true;       
    }

    ngAfterViewInit() {        
    }

    onStepChange(i: number) {
        this.activeStepIndex = i;
        this.steps[this.activeStepIndex].visited = true;
        this.refreshView();
    }   

    onStepValueChange(event: any, index: number = 0) {
        this.info = event;        
    }

    onStepValidityChange(valid: boolean, i: number) {        
        this.steps[i].valid = valid;        
        this.refreshView();
    }   

    isValid() {
        return differenceDeep.isDifference(this.info, this.originalInfo) && this.steps.findIndex((step, index) =>step.valid == false && index < 3) < 0;
    }
    
    openFeedbackDialog() {
        let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');			
        feedbackWindow.open();
    }   

    onClose(event: MouseEvent) {
        this.close.emit();
    }

    onSubmit(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isValid())
            this.submit.emit(this.info);
    }    

    refreshView() {
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {		
	}
}
