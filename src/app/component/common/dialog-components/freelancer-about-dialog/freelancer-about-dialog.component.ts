import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, Renderer } from '@angular/core';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { User, ExpertiseInfo } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createFreelancerAboutDialogWindow(
    windowService: WindowService,
    info: User,    
    width: number = 380,    
	
): DialogWindow<FreelancerAboutDialogComponent> {
	return windowService.create<FreelancerAboutDialogComponent>(
		FreelancerAboutDialogComponent,
		{
            width: width,
            position: {
				left: 'calc(50% - 190px)',
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
		comp.close.subscribe(() => window.close());
	});
}

@Component({
    moduleId: module.id,
    selector: 'freelancer-about',
    templateUrl: './freelancer-about-dialog.component.html',
    styleUrls: ['./freelancer-about-dialog.component.css']    
})

export class FreelancerAboutDialogComponent implements OnInit, OnDestroy{
    @Input() info: User = new User;    
    @Output() close = new EventEmitter<void>();

    expertise1: {id: number, description: string}[] = [];      
    expertise2: {id: number, description: string}[] = [];

    constructor(        
        private changeDetector: ChangeDetectorRef,        
        private windowService: WindowService
    ) {
    }

    ngOnInit() {        
        if (this.info.services.length > 1) {
            let l = Math.ceil(this.info.services.length / 2);
            this.expertise1 = this.info.services.slice(0, l);
            this.expertise2 = this.info.services.slice(l);
        } else {
            this.expertise1 = this.info.services;
            this.expertise2 = [];            
        }
    }   
    
    openFeedbackDialog() {
        let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');			
        feedbackWindow.open();
    }   

    onClose(event: MouseEvent) {
        this.close.emit();
    }    

    refreshView() {
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {		
	}
}
