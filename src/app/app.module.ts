import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule, JsonpModule, BrowserXhr } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';

import { StoreModule } from '@ngrx/store';
import { StoreRouterConnectingModule, RouterStateSerializer } from '@ngrx/router-store';
import { EffectsModule } from '@ngrx/effects';

import { ToastrModule } from 'ngx-toastr';
import { MomentModule } from 'angular2-moment'; // optional, provides moment-style pipes for date formatting

import { AuthModule } from '@app-auth/auth.module';
import { SharedModule } from '@app-shared/shared.module';
import { HeaderModule } from '@app/component/header/header.module';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { GErrorHandler } from '@app-common/error-handler/error-handler';
import { Inactivity } from '@app-directives/inactivity';

import { DashboardModule } from '@app-dashboard/dashboard.module';
import { ViewModule } from '@app-common/page-canvas/preview/view/view.module';

import { reducers, localStorageSyncReducer, metaReducers } from '@app/stores/reducers';
import { AuthGuard } from '@app-auth/services/auth-guard.service';

import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
import { AlertService, ImageService, SitemapService, TreeService, EmailService, StatsService, WSService, FeedbackService } from '@app/services';
import { routing } from '@app/app.routes';
import { AppComponent } from '@app/app.component';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		SharedModule,
		BrowserModule,
		BrowserAnimationsModule,
		HttpModule,
		HttpClientModule,
		JsonpModule,
		Inactivity,
		MomentModule,
		Angulartics2Module.forRoot(
			[Angulartics2GoogleAnalytics],
			{
				pageTracking: {
				clearQueryParams: true,
				clearHash: true
				}
			}
		),
		StoreModule.forRoot(reducers, { metaReducers }),
		EffectsModule.forRoot([]),
		StoreRouterConnectingModule,

		AuthModule.forRoot(),
		ToastrModule.forRoot({
			timeOut: 2000,
			positionClass: 'toast-top-left',
			preventDuplicates: true,
		}),
		HeaderModule,
		AttentionDialogModule,
		DashboardModule,
		ViewModule,
		routing
	],
	providers: [
		CanDeactivateGuard,
		WindowService,
		AppService,
		ImageService,
		TreeService,
		EmailService,
		StatsService,
		WSService,
		// AuthGuard,
		// {
		// 	provide: ErrorHandler,
		//   	useClass: GErrorHandler
		// },
		AlertService,
		SitemapService,
		FeedbackService,
		{provide: APP_BASE_HREF, useValue : '/' }
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
