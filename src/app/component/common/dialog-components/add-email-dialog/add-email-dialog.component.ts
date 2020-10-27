import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Store, select } from "@ngrx/store";

import { AppState, getRouterState } from "@app/stores/reducers";
import * as fromAuth from "@app-auth/store/reducers";
import * as Auth from "@app-auth/store/actions/auth";
import { User, UserSite, Sitemap } from "@app/models";
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createEmailSentDialogWindow } from '@app-dialogs/email-sent-dialog/email-sent-dialog.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AlertService } from '@app/services/alert.service';
import { AuthService } from '@app/auth/services/auth.service';

export function createAddEmailDialogWindow(
  	windowService: WindowService,
): DialogWindow<AddEmailDialogComponent> {
	return windowService.create<AddEmailDialogComponent>(
		AddEmailDialogComponent,
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
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	selector: 'glogood-add-email-dialog',
	templateUrl: './add-email-dialog.component.html',
	styleUrls: ['./add-email-dialog.component.css']
})
export class AddEmailDialogComponent implements OnInit, OnDestroy {

	@Output() submit = new EventEmitter<any>();
	@Output() close = new EventEmitter<void>();

	emails: {email: string, confirmDate: any, id: number}[];
	showEmailValue = (e) => e ? e.email : '';
	selectedEmail: {email: string, confirmDate: any, id: number};

	form: FormGroup;

	authUpdatePending$ = this._store.pipe(select(fromAuth.getUpdatePending));
	authUpdated$ = this._store.pipe(select(fromAuth.getUpdated));
	authError$ = this._store.pipe(select(fromAuth.getAuthError));

	private _viewInited: boolean = false;
	private _subs: Subscription[] = [];

	constructor(
		private _store: Store<AppState>,
		private _windowService: WindowService,
		private _formBuilder: FormBuilder,
		private _changeDetectRef: ChangeDetectorRef,
		private _alertService: AlertService,
		private _authService: AuthService
	) {

	}

	ngOnInit() {
		this.form = this._formBuilder.group({
			email : ['', [Validators.required, Validators.email]],
		});

		this._authService.getUserEmails()
			.pipe()
			.subscribe(
				(res: any) => {
					this.emails = res;
					if (this._viewInited)
						this._changeDetectRef.detectChanges();
				}
			);

		this._subs = [
			this.form.valueChanges.pipe().subscribe(res => {
				this._changeDetectRef.detectChanges();
			}),

			this.authError$.subscribe(res => {
				if (res && this._viewInited) {
					this._alertService.playToast('Failed', res, 1);
				}
			}),
			this.authUpdatePending$.subscribe(res => {
				if (this._viewInited)
					this._changeDetectRef.detectChanges();
			}),

			this.authUpdated$.subscribe(res => {
				if (res && this._viewInited) {
					this._alertService.playToast('Success', 'Your email has been added.', 0);
					const diag = createEmailSentDialogWindow(this._windowService, this.form.value.email);
					diag.open();

					diag.componentRef.instance.close.subscribe(res1 => {
						this.submit.emit(this.form.value.email);
					});
				}
			})
		];

		this._viewInited = true;
	}

	ngOnDestroy() {
		this._viewInited = false;
		this._subs.forEach(s => s.unsubscribe());
	}

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this._windowService, 'fund.001');
		feedbackWindow.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	onSubmit(event: MouseEvent) {
		this._store.dispatch(new Auth.AddEmail(this.form.value.email));
	}

	onSelectEmail(event) {
		this.submit.emit(event.email);
	}

}
