import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { User, FreelancerHireInfo } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createFreelancerHireMeDialogWindow(
    windowService: WindowService,
    info: User = new User,    
	
): DialogWindow<FreelancerHireMeDialogComponent> {
	return windowService.create<FreelancerHireMeDialogComponent>(
		FreelancerHireMeDialogComponent,
		{
            width: 360,
            position: {
				left: 'calc(50% - 180px)',
				top: 'calc(20px)'
            },            
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
        comp.info = info;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
    moduleId: module.id,
    selector: 'freelancer-hire-me',
    templateUrl: './freelancer-hire-me-dialog.component.html',
    styleUrls: ['./freelancer-hire-me-dialog.component.css']    
})

export class FreelancerHireMeDialogComponent implements OnInit, OnDestroy{
    
    @Input() info: User = new User;  

    @Output() submit = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();   

    form: FormGroup;    
    private subs: Rx.Subscription[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private changeDetector: ChangeDetectorRef,        
        private windowService: WindowService
    ) {        
        this.form = this.formBuilder.group({
            projectType: ['1'],
            priceType: ['1'],
            price   : ['', Validators.required],
            request : ['', Validators.required],
            startDate: [new Date]            
        });
    }

    ngOnInit() {        
        this.subs = [
            this.form.valueChanges.subscribe(res => {
                this.refreshView();
            })
        ];
    }    

    isValid() {        
        // return differenceDeep.isDifference(this.info, this.originalInfo) && this.steps.findIndex(step=>step.valid == false) < 0;
    }
    
    openFeedbackDialog() {
        let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');			
        feedbackWindow.open();
    }   

    onClose(event: MouseEvent) {
        this.close.emit();
    }

    onSubmit(event: MouseEvent) {

        let omitdata = ['showService', 'durationCtrl', 'customerLimitCtrl','priceCtrl', 'locationsCtrl', 'servicesCtrl', 'createdate'];        
        
        // this.info = omitDeep.omitDeep(this.info, omitdata);
        this.submit.emit();
        
    }    

    refreshView() {
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
	}
}
