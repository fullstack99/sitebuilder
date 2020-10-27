import { Component, ChangeDetectorRef, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { emailValid } from '@app-lib/validators';
import { ProviderInfo, ServiceInfo} from '@app/models';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createSendAppointmentWindow(
	windowService: WindowService,
	provider: ProviderInfo = null,
	service: ServiceInfo = null,
	date: Date = new Date,
	name: string = '',
	email: string = '',
	phone: string = ''
	
): DialogWindow<SendAppointmentComponent> {
	return windowService.create<SendAppointmentComponent>(
		SendAppointmentComponent,
			{            
				width: 300,
				position: {
					left: 'calc(50% - 150px)',
					top: '50px'
				}, 					
				modal: true,
				draggable: false,
				resizable: true,
				scrollable: false,
				visible: false,
				title: false
			}
	)
	.changeInputs(
		(comp, window) => {
			comp.provider = provider;
			comp.service = service;
			comp.date = date;
			comp.name = name;
			comp.email = email;
			comp.phone = phone;
			comp.submit.subscribe(() => window.close());
			comp.close.subscribe(() => window.close());
		});
}

@Component({
	moduleId: module.id,
	selector: 'app-send',
	templateUrl: './send.component.html',
	styleUrls: ['./send.component.css']
})

export class SendAppointmentComponent implements OnInit, OnDestroy {
	@Input() provider: ProviderInfo = null;
	@Input() service: ServiceInfo = null;
	@Input() date: Date = new Date;
	@Input() name: string = '';
	@Input() email: string = '';
	@Input() phone: string = '';
	
	@Output() submit = new EventEmitter<boolean>();
	@Output() close = new EventEmitter<boolean>();	

	form: FormGroup;
	private subs: Rx.Subscription[] = [];

	constructor(		
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private formBuilder: FormBuilder,
		private windowService: WindowService	
	) { }

	ngOnInit() {		
		this.form = this.formBuilder.group({
			['name']: [this.name, Validators.required],
			['email']: [this.email, emailValid],			
			['phone']: [this.phone],
		});
	}

	get showProviderValue() {
		return this.provider ? this.provider.name : '';	
	} 
	get showServiceValue() {
		return this.service ? this.service.title : '';
	}
	
	openFeedbackDialog() {		
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fo.d.122');		
		feedbackWindow.open();
	}

	onClose() {
		this.close.emit(false);
	}

	onSendEmail() {
		this.submit.emit(true);
	}

	onCancelAppointment() {
		this.submit.emit(false);
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}

}

