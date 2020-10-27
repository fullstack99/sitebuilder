import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ViewChild,
    ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Steps } from '@app-ui/steps/steps.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { User, ExpertiseInfo } from '@app/models';
import { FreelancerService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createFreelancerSetupDialogWindow(
    windowService: WindowService,
    user: User = new User,
    activeStepIndex = 0,
    certified = false,

): DialogWindow<FreelancerSetupDialogComponent> {
	return windowService.create<FreelancerSetupDialogComponent>(
		FreelancerSetupDialogComponent,
		{
            width: 460,
            position: {
				left: 'calc(50% - 230px)',
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
    comp.user = user;
    comp.activeStepIndex = activeStepIndex;
    comp.certified = certified,
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
    moduleId: module.id,
    selector: 'freelancer-setup',
    templateUrl: './freelancer-setup-dialog.component.html',
    styleUrls: ['./freelancer-setup-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class FreelancerSetupDialogComponent implements OnInit, AfterViewInit, OnDestroy{

    @Input() user: User;
    @Input() activeStepIndex = 0;
    @Input() certified: boolean = false;

    @Output() submit = new EventEmitter<User>();
    @Output() close = new EventEmitter<void>();

    steps: Steps[] = [
        { name: 'Account', valid: false, touched: false, visited: false },
        { name: 'About', valid: false, touched: false, visited: false },
        { name: 'Hire Me', valid: false, touched: false, visited: false },
        { name: 'Payment', valid: false, touched: false, visited: false }
    ];
    public expertise: ExpertiseInfo[] = [];

    public isNew: boolean = true;
    public info: User;
    private originalInfo: User;


    constructor(
        private changeDetector: ChangeDetectorRef,
        private freelancerService: FreelancerService,
        private windowService: WindowService
    ) {
    }

    ngOnInit() {
        if (!this.user)
          this.user = new User;
        else
          this.isNew = false;

        this.info = lodash.cloneDeep(this.user);

        if (this.info.services)
          this.info.services = this.info.services.map(s=>s.id ? s.id : s);

        this.originalInfo = lodash.cloneDeep(this.info);

        this.steps[0].visited = true;

        if (this.info && this.info.name) {
            this.steps[0].valid = true;
        }

        if (this.info && this.info.description && this.info.services && this.info.services.length > 0) {
            this.steps[1].visited = true;
            this.steps[1].valid = true;
        }

        if (this.info && this.info.hourlyRate && this.info.minimum) {
            this.steps[2].visited = true;
            this.steps[2].valid = true;
        }

        if (!this.certified)
            this.steps.splice(1,1);

        this.freelancerService.getExpertise().subscribe(
            res => {
                this.expertise = res;
            },
            error=> {
                console.log(error);
                this.expertise = [];
            },
            () => {
                this.changeDetector.detectChanges();
            }
        )
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

    goLogin(event) {
        this.submit.emit(null);
    }

    refreshView() {
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {
    }

    @HostListener('dragover', ['$event']) onEleDragOver(e) {
        e.preventDefault();
    }

    @HostListener('drop', ['$event']) onEleDrop(e) {
        e.preventDefault();
    }
}
