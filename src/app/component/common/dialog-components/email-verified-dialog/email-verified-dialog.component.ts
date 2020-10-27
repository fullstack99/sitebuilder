import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, HostListener, Input
} from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { AuthService } from '@app-auth/services/auth.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


/** */
export function createEmailVerifiedDialogWindow(
	windowService: WindowService,
	code: string = '',
	userId: string = '',
	email: string = '',
	url: string = ''
): DialogWindow<EmailVerifiedDialogComponent> {
return windowService.create<EmailVerifiedDialogComponent>(
	EmailVerifiedDialogComponent,
	{
			width: 300,
			height: 300,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
	}
).changeInputs((comp, window) => {
	comp.userId = userId;
	comp.code = code;
	comp.email = email;
	comp.url = url;
	comp.close.subscribe(() => window.close());
});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'email-verified-dialog.component.html',
	styleUrls: ['email-verified-dialog.component.css']
})
export class EmailVerifiedDialogComponent implements OnInit, OnDestroy {

	@Input() code: string = '';
	@Input() userId: string = '';
	@Input() email: string = '';
	@Input() url: string = '';

	@Output() close = new EventEmitter<boolean>();

	isNewEmail: boolean;
	loading: boolean = true;
	verified: boolean = false;

	constructor(
		private _elementRef: ElementRef,
		private _changeDetector: ChangeDetectorRef,
		private _authService: AuthService
	) {}

	ngOnInit() {
		this.isNewEmail = (this.url == 'api/account/newemail/confirm');
		this._authService.getEmailConfirm(this.userId, this.code, this.email, this.url)
			.pipe()
			.subscribe(res => {
				console.log(res);
				if (res['success'])
					this.verified = true;
				this.loading = false;
				this._changeDetector.detectChanges();
			},
			error => {
				console.log(error);
				this.loading = false;
				this.verified = false;
				this._changeDetector.detectChanges();
			},
			() => {})
	}

	openFeedbackDialog() {

	}

	onClose(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.close.emit(false);
	}

	onSubmit(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.close.emit(this.verified && !this.isNewEmail);
	}

	onCancelled() {

	}

	ngOnDestroy() {
	}
}
