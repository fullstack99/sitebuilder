import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SocialLoginModule, AuthServiceConfig, GoogleLoginProvider,  FacebookLoginProvider } from 'angular5-social-login';

import { GoogleAPIInfo, FaceBookAPIInfo} from '@app-shared/constants';

import { SharedModule } from '@app-shared/shared.module';

import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { RegisterFormModule } from '@app-ui/register-form/register-form.module';

import { LoginFormComponent } from '@app-auth/components/login-form/login-form.component';
import { ChangePasswordFormComponent } from '@app-auth/components/change-password-form/change-password-form.component';

import { LoginPageComponent } from '@app-auth/containers/login-page/login-page.component';
import { RegisterPageComponent } from '@app-auth/containers/register-page/register-page.component';
import { ChangePasswordPageComponent } from '@app-auth/containers/change-password-page/change-password-page.component';
import { ForgottenPasswordPageComponent } from '@app-auth/containers/forgotten-password-page/forgotten-password-page.component';

import { AuthService } from '@app-auth/services/auth.service';
import { AuthGuard } from '@app-auth/services/auth-guard.service';
import { AuthEffects } from '@app-auth/store/effects/auth.effects';
import { reducers } from '@app-auth/store/reducers';

export function getAuthServiceConfigs() {
	const config = new AuthServiceConfig(
		[
		  {
			id: FacebookLoginProvider.PROVIDER_ID,
			provider: new FacebookLoginProvider(FaceBookAPIInfo.facebookAppId)
		  },
		  {
			id: GoogleLoginProvider.PROVIDER_ID,
			provider: new GoogleLoginProvider(GoogleAPIInfo.client_id)
		  },
		]
	);
	return config;
}

export const COMPONENTS = [
	LoginFormComponent, LoginPageComponent,
	RegisterPageComponent,
	ChangePasswordFormComponent, ChangePasswordPageComponent,
  ForgottenPasswordPageComponent
];

@NgModule({
	imports: [
		SharedModule,
		HttpModule,
		HttpClientModule,
		RouterModule,
		// SocialLoginModule,
		FeedbackDialogModule,
		LoadingModule,
		DropDownModule,
		RadioGroupModule,
	RegisterFormModule,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
	entryComponents: [LoginPageComponent, RegisterPageComponent, ChangePasswordPageComponent, ForgottenPasswordPageComponent]
})

export class AuthModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: RootAuthModule,
			providers: [
				AuthGuard,
				{
					provide: AuthServiceConfig,
					useFactory: getAuthServiceConfigs
				}
			],
		};
	}
}

@NgModule({
	imports: [
		AuthModule,
		StoreModule.forFeature('auth', reducers),
		EffectsModule.forFeature([AuthEffects]),
	],
	providers: [AuthService]
})
export class RootAuthModule {}
