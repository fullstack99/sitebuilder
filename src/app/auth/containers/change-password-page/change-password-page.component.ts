import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Credentials } from '@app/models';
import * as fromAuth from '@app-auth/store/reducers';
import * as Auth from '@app-auth/store/actions/auth';

@Component({
	selector: 'app-change-password-page',
	templateUrl: './change-password-page.component.html',
	styleUrls: ['./change-password-page.component.css']
})
export class ChangePasswordPageComponent implements OnInit {

	pending = this.store.pipe(select(fromAuth.getRegisterPagePending));
	error = this.store.pipe(select(fromAuth.getRegisterPageError));
	
	constructor(private store: Store<fromAuth.State>) {}

	ngOnInit() {}

	onSubmit(event) {
		this.store.dispatch(new Auth.Register(event));
	}
}
