import {
	Component,
	ChangeDetectorRef,
	OnInit,
	OnDestroy,
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef
} from "@angular/core";
import { Store, select } from "@ngrx/store";
import * as Rx from "rxjs/Rx";

import { createFeedbackDialogWindow } from "@app-dialogs/feedback-dialog/feedback-dialog.component";
import { User, AccountType } from "@app/models";
import { WindowService, DialogWindow } from "@app-common/window/window.service";
import { AlertService } from "@app/services";
import { AuthService } from "../../services/auth.service";
import * as fromAuth from "@app-auth/store/reducers";
import * as Auth from "@app-auth/store/actions/auth";

export function createUserRegisterWindow(
	windowService: WindowService,
	loginFlag = false,
	fromPageCanvas = false,
	contributor = false,
	siteId = '',
	code = ''
): DialogWindow<RegisterPageComponent> {
	return windowService
		.create<RegisterPageComponent>(RegisterPageComponent, {
			width: 380,
			position: {
				left: "calc(50% - 160px)",
				top: "50px"
			},
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		})
		.changeInputs((comp, window) => {
			comp.loginFlag = loginFlag;
			comp.fromPageCanvas = fromPageCanvas;
			comp.contributor = contributor;
			comp.siteId = siteId;
			comp.code = code;
			comp.closeEmitter.subscribe(() => window.close());
			comp.window = window;
		});
}

@Component({
	selector: "app-register-page",
	templateUrl: "./register-page.component.html",
	styleUrls: ["./register-page.component.css"]
})
export class RegisterPageComponent implements OnInit, OnDestroy {
	@Input("login") loginFlag: boolean = false;
	@Input() fromPageCanvas: boolean = false;
	@Input() contributor: boolean = false;
	@Input() siteId: string = '';
	@Input() code: string = '';

	@Output("close") closeEmitter = new EventEmitter<boolean>();
	@Output("window") window: DialogWindow<RegisterPageComponent>;

	info: User;
	loading: boolean = false;
	errorMessage: string = "";

	isNew: boolean = false;

	user$ = this.store.pipe(select(fromAuth.getUser));
	loggedIn$ = this.store.pipe(select(fromAuth.getLoggedIn));
	pending$ = this.store.pipe(select(fromAuth.getRegisterPagePending));
	error$ = this.store.pipe(select(fromAuth.getRegisterPageError));
	success$ = this.store.pipe(select(fromAuth.getRegisterPageSuccess));

	email: string = '';

	viewInited: boolean = false;
	emailSent: boolean = false;
	expired: boolean = false;
	callRegister: boolean = false;
	resendingEmail: boolean = false;

	private subs: Rx.Subscription[] = [];

	constructor(
		private store: Store<fromAuth.State>,
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService,
		private windowService: WindowService,
		private authService: AuthService
	) {}

	ngOnInit() {
		this.subs = [
			this.pending$.subscribe(res => {
				if (res) {
					this.setDisable();
				} else {
					this.setActive();
				}
			}),

			this.error$.subscribe(res => {
				if (res) {
					this.alertService.playToast("Failed", res, 1);
					this.errorMessage = res;
					this.callRegister = false;
					this.refreshView();
				}
			}),

			this.success$.subscribe(res => {
				if (this.callRegister && res) {
					this.alertService.playToast("Register Success", "You are registered", 0);
					this.emailSent = true;
					this.callRegister = false;
					this.countExpired();
					this.refreshView();
				}
			}),

			// this.loggedIn$.subscribe(res=> {
			//		 if (res) {
			//				 this.alertService.playToast('Success', 'You logged in', 0);
			//				 this.onClose();
			//		 }
			// }),
			this.user$.subscribe(res => {
				this.info = res;
				this.isNew = !res;
			})
		];
		this.viewInited = true;
		// let aa: User = {
		//	 "uid":"d7d0384c-d4fc-44f8-bbee-acea3fc92c82",
		//	 "email":"glogoodtest1@mailinator.com",
		//	 "name":"Test1",
		//	 "password": "Glogood2018!",
		//	 "description":"test1",
		//	 "country":"USA",
		//	 "timeZone":"Afghanistan Standard Time",
		//	 "accountType": AccountType.Freelancer,
		//	 "hourlyRate": 100,
		//	 "minimum": 80,
		//	 "photo":null,
		//	 "services":[1,2],
		//	 "otherServices":[]
		// }

		// this.store.dispatch(
		//	 new Auth.Register({
		//		 user: aa,
		//		 login: this.loginFlag,
		//		 isFreelancer: true
		//	 })
		// );
	}

	setDisable() {
		this.loading = true;
		this.changeDetector.detectChanges();
		this.window.kendoWindow.wrapper.css({
			"pointer-events": "none"
		});
	}

	setActive() {
		this.loading = false;
		this.changeDetector.detectChanges();
		this.window.kendoWindow.wrapper.css({
			'pointer-events': 'auto'
		});
	}

	countExpired() {
		setTimeout(() => {
			if (this.emailSent && this.viewInited)
				this.expired = true;
				this.refreshView();
		}, 1000 * 1800);
	}

	verifyEmail() {
		if (!this.email) return;
		window.open("https://" + this.email, "emailWindow");
		this.closeEmitter.emit(true);
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, "lo.p.110.").open();
	}

	login(): void {
		this.closeEmitter.emit();
		this.store.dispatch(new Auth.LoginRequired(true));
	}

	resendEmail(): void {
		this.resendingEmail = true;
		this.refreshView();

		this.authService.resendEmail(this.email)
			.pipe()
			.subscribe(
				res => {
					this.resendingEmail = false;
					this.refreshView();
					this.alertService.playToast('Success', 'Resent Email');
				},
				error => {
					this.resendingEmail = false;
					this.refreshView();
					this.alertService.playToast(error.error, error.errorDescription, 1);
				})
	}

	onSubmit(event: User) {
		if (event && event.accountType == AccountType.Both) {
			this.callRegister = true;
			this.email = event.email;
			this.store.dispatch(new Auth.Update(event, false));
		} else if (event) {
			this.callRegister = true;
			this.email = event.email;
			this.store.dispatch(
				new Auth.Register({
					user: event,
					login: this.loginFlag,
					isFreelancer: false,
					contributor: this.contributor,
					siteId: this.siteId,
					code: this.code
				})
			);
		} else {
			this.closeEmitter.emit(true);
			this.store.dispatch(new Auth.LoginRequired(true));
		}
	}

	onClose(): void {
		this.closeEmitter.emit(undefined);
	}

	refreshView() {
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
