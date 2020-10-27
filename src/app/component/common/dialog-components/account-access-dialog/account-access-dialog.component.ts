import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Store, select } from "@ngrx/store";

import { AppState, getRouterState } from "@app/stores/reducers";
import * as fromAuth from "@app-auth/store/reducers";
import { User, UserSite, Sitemap } from "@app/models";
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createEmailSentDialogWindow } from '@app-dialogs/email-sent-dialog/email-sent-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { AlertService } from '@app/services/alert.service';
import { AuthService } from '@app-auth/services/auth.service';

export function createAccountAccessDialogWindow(
	windowService: WindowService,
	info: any
): DialogWindow<AccountAccessDialogComponent> {
return windowService.create<AccountAccessDialogComponent>(
	AccountAccessDialogComponent,
	{
		width: 380,
		position: {
			left: 'calc(50% - 190px)',
			top: '50px'
		},
		modal: true,
		draggable: false,
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
	selector: 'glogood-account-access-dialog',
	templateUrl: './account-access-dialog.component.html',
	styleUrls: ['./account-access-dialog.component.css']
})
export class AccountAccessDialogComponent implements OnInit {

	@Input() info: any;
	@Input() activeStepIndex = 0;

	@Output() submit = new EventEmitter<any>();
	@Output() close = new EventEmitter<void>();

	form: FormGroup;
	site: UserSite = null;
	sites: UserSite[] = [];
	showSiteValue = (site) =>site.name;

	services = [
		[
		{ serviceId: 17, description: 'Website'},
		{ serviceId: 16, description: 'Blog'},
		{ serviceId: 20, description: 'Ecommerce'},
		{ serviceId: 13, description: 'Email Marketing'},
		{ serviceId: 22, description: 'Event'},
		{ serviceId: 18, description: 'Forms'},
		],
		[
		{ serviceId: 23, description: 'Appt. Schedule'},
		{ serviceId: 15, description: 'Invitation'},
		{ serviceId: 14, description: 'Photo Album'},
		{ serviceId: 19, description: 'Surveys'},
		{ serviceId: 21, description: 'Fundraising'},

		// { service: 25, description: 'Email Contacts'}
		]
	];

	selectedServices = [];

	user$: Observable<User>;
	private subs: Subscription[] = [];

	constructor(
		private store: Store<AppState>,
		private windowService: WindowService,
		private _formBuilder: FormBuilder,
		private changeDetectRef: ChangeDetectorRef,
		private _alertService: AlertService,
		private _authService: AuthService
	) {

	}

	ngOnInit() {

		this.user$ = this.store.pipe(select(fromAuth.getUser));

		this.form = this._formBuilder.group({
			name			: ['', Validators.required],
			email		   : ['', [Validators.required, Validators.email]],
			allAccessControl: [false],
			analyticsControl: [false],
			editControl	 : [false],
		});

		this.form.valueChanges.pipe().subscribe(res => {
			if (res.allAccessControl) {
				this.form.patchValue({
				analyticsControl: false,
				editControl: false
				},
				{emitEvent: false});
			}
			this.changeDetectRef.detectChanges();
		});

		this.subs = [
			this.user$.pipe().subscribe(res => {
				this.sites = res && res.sites ? res.sites : [];
			}),
		];
	}

	isValidSubmit() {
		return
	}

	isItemChecked(service, editOrAnalytics) {
		const temp = this.selectedServices.find(s => s.serviceId == service.serviceId && s[editOrAnalytics]);
		return !!temp;
	}

	onItemCheckChange(event, editOrAnalytics, service, i) {
		if (service.description === '') {
			return;
		}
		let temp = this.selectedServices.find(s => s.serviceId == service.serviceId);

		if (event.target.checked) {
			if (temp) {
				temp[editOrAnalytics] = true;
			} else {
				temp = {
					serviceId: service.serviceId,
					analytic: false,
					createEdit: false
				};
				temp[editOrAnalytics] = true;
				this.selectedServices.push(temp);
			}
		} else {
			if (temp) {
				temp[editOrAnalytics] = false;
			}
			this.selectedServices = this.selectedServices.filter(s => s['analytic'] || s['createEdit']);
		}
		this.changeDetectRef.detectChanges();
	}

	onSitesChange(event) {
		this.site = event;
	}

	onAccessUserSite(event) {
		const data = {
			email: this.form.value['email'],
			name: this.form.value['name'],
			allAccess: this.form.value['allAccessControl'],
			access: this.selectedServices
		}

		this._authService.accessUserSite(data, this.site.uid).subscribe(
			res => {
				if (res) {
					this._alertService.playToast("Success", "You just added an individual to your access your account.", 0);
					const diag = createEmailSentDialogWindow(this.windowService, this.form.value.email);
					diag.open();

					diag.componentRef.instance.close.subscribe(res1=> {
						this.submit.emit(this.form.value.email);
					});
				}
			},
			error => {

			}
		)
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
		feedbackWindow.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

}
