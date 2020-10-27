import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ViewChild, 
	ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';

import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import * as omitDeep from '@app-lib/functions/omit-deep'
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { AttentionDialogComponent, createAttentionDialogWindow, AttentionInfo, DispStr } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { Steps } from '@app-ui/steps/steps.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { LocationsComponent } from '@app-dialogs/scheduler-setup-dialog/locations/locations.component';
import { ServicesComponent } from '@app-dialogs/scheduler-setup-dialog/services/services.component';
import { ProvidersComponent } from '@app-dialogs/scheduler-setup-dialog/providers/providers.component';
import { HoursComponent } from '@app-dialogs/scheduler-setup-dialog/hours/hours.component';
import { CommonItemContent, ScheduleInfo, LocationInfo, ServiceInfo, ProviderInfo, HourInfo  } from '@app/models';
import { SchedulerService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createSchedulerSetupDialogWindow(
	windowService: WindowService,
	activeStepIndex = 0,
	itemContent: CommonItemContent<ScheduleInfo> = new CommonItemContent<ScheduleInfo>(Maybe.just(new ScheduleInfo)),	
	width: number = 460,	
	
): DialogWindow<SchedulerSetupDialogComponent> {
	return windowService.create<SchedulerSetupDialogComponent>(
		SchedulerSetupDialogComponent,
		{
			width: width,
			position: {
				left: 'calc(50% - 230px)',
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
		comp.itemContent = itemContent;
		comp.activeStepIndex = activeStepIndex;			  
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'calendar-setup',
	templateUrl: './scheduler-setup-dialog.component.html',
	styleUrls: ['./scheduler-setup-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class SchedulerSetupDialogComponent implements OnInit, AfterViewInit, OnDestroy{

	@Input() itemContent: CommonItemContent<ScheduleInfo>;
	@Input() isNew: boolean = true;
	@Input() activeStepIndex = 0;

	@ViewChild(LocationsComponent) locationsComponent: LocationsComponent;
	@ViewChild(ProvidersComponent) providersComponent: ProvidersComponent;
	@ViewChild(ServicesComponent) servicesComponent: ServicesComponent;
	@ViewChild(HoursComponent) hoursComponent: HoursComponent;

	@Output() submit = new EventEmitter<CommonItemContent<ScheduleInfo>>();
	@Output() close = new EventEmitter<void>();	

	steps: Steps[] = [
		{ name: 'Locations', valid: false, touched: false, visited: false },
		{ name: 'Services', valid: false, touched: false, visited: false },
		{ name: 'Providers', valid: false, touched: false, visited: false },
		{ name: 'Hours', valid: false, touched: false, visited: false }
	];
		
	info: ScheduleInfo = new ScheduleInfo;
	originalInfo : ScheduleInfo = new ScheduleInfo;

	constructor(		
		private changeDetector: ChangeDetectorRef,		
		private windowService: WindowService
	) {
	}

	ngOnInit() {
		if (this.itemContent.info.hasValue()) {
			this.info = lodash.cloneDeep(this.itemContent.info.value);
		}
		this.isNew = this.info.isNew;
		if (this.info.companyName != '') {			
			this.steps.forEach(step=> {
				step.valid = true;
			});
		}		
		this.originalInfo = lodash.cloneDeep(this.info);
		this.steps[0].visited = true;
	}

	ngAfterViewInit() {		
		this.steps[0].touched = true;
	}

	onStepChange(i: number) {
		if (this.activeStepIndex == i) return;
		if (!this.steps[this.activeStepIndex].valid) {
			let attentionInfo : AttentionInfo;
			let attentionWindow: DialogWindow<AttentionDialogComponent>;
			attentionInfo = new AttentionInfo(
				{ value: 'Warning!', font_size: '22px', color: 'orange' },
				[
					{ value: 'You did not fill in the required fields.', font_size: '16px', color: '#8c8c8c' },							
				],
				false,
				['OK'],
				''
			);		   

			attentionWindow = createAttentionDialogWindow(this.windowService,attentionInfo);
		
			attentionWindow.componentRef.instance.submit.subscribe((feedback) => {			
				if (feedback) {					
					this.activeStepIndex = i;
					this.steps[this.activeStepIndex].visited = true;
					this.refreshView();
					this.steps[this.activeStepIndex].touched = true;
				}
				else {									
				}
			});
			attentionWindow.open();
			return;
		}
		this.activeStepIndex = i;
		this.steps[this.activeStepIndex].visited = true;
		this.refreshView();
		this.steps[this.activeStepIndex].touched = true;
	}   

	onStepValueChange(event: any, index: number = 0) {
		// this.info = event;		
	}

	onStepValidityChange(valid: boolean, i: number) {		
		this.steps[i].valid = valid;
		let r: any = [];
		if (i == 0 && this.info.locationType == 'CustomerComesToUs' && this.info.locations) {
			r = this.info.locations.filter(l=>l.willHoursChange);
		}
		else if (i == 2 && ['SingleProviderHidden', 'SingleProviderDisplay'].indexOf(this.info.providerType) < 0 && this.info.providers) {
			r = this.info.providers.filter(p=>p.willHoursChange);
		}

		if (r.length > 0) this.steps[i].valid = false;
		this.refreshView();
	}

	onLocationTypeChange() {
		this.steps[3].valid = false;
		this.refreshView();
	}

	isValid() {		
		return differenceDeep.isDifference(this.info, this.originalInfo) && this.steps.findIndex(step=>step.valid == false) < 0;
	}
		
	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');			
		feedbackWindow.open();
	}   

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	onSubmit(event: MouseEvent) {
		if (this.locationsComponent) this.locationsComponent.ngOnDestroy();
		if (this.servicesComponent) this.servicesComponent.ngOnDestroy();
		if (this.providersComponent) this.providersComponent.ngOnDestroy();
		if (this.hoursComponent) this.hoursComponent.ngOnDestroy();

		if (this.info.locationType == 'WeGoToCustomerLocation') {
			if (this.isNew) {
				this.info.locations = [];
			}
			else {
				this.info.locations = this.info.locations.filter(l=> {
					if (l.editStatus == 'New')
						return false;
					else {
						l.editStatus = 'Deleted';
						return true;
					}
				});
			}
		}

		if (this.info.providerType == 'SingleProviderHidden') {
			if (this.isNew) {
				this.info.providers = null;
			}
			else if (this.info.providers) {
				this.info.providers.forEach(p=> {
					p.editStatus = 'Deleted';
				})
			}
			
		}
		else if (['SingleProviderDisplay'].indexOf(this.info.providerType) >= 0 && this.info.providers && this.info.providers.length > 0) {
			if (this.isNew) {
				if (this.info.services)
					this.info.providers[0].services = this.info.services.map(service=>service.uid);
				this.info.providers = [this.info.providers[0]];
			}
			else if (this.info.providers) {
				let first: boolean = false;
				this.info.providers.forEach(p=> {
					if (first)
						p.editStatus = 'Deleted';
					else if (p.editStatus != 'Deleted') {
						first = true;
						if (this.info.services)
							p.services = this.info.services.map(service=>service.uid);
					}
				})
			}
		}

		let omitdata = ['showService', 'durationCtrl', 'customerLimitCtrl','priceCtrl', 'locationsCtrl', 'servicesCtrl', 'willHoursChange'];		
		if (this.isNew)
			omitdata.push('editStatus');		
		this.info = omitDeep.omitDeep(this.info, omitdata);
		// console.log(JSON.stringify(this.info));
		console.log(this.info);
		this.submit.emit(this.itemContent.setInfo(Maybe.just(this.info)));
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
