import { Routes, RouterModule } from '@angular/router';
// import { IdlePreload, IdlePreloadModule } from '@angularclass/idle-preload';
import { DashboardComponent } from '@app-dashboard/dashboard.component';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard'
	},
	{
		path: 'api/account/email/confirm',
		pathMatch: 'full',
		component: DashboardComponent
	},
	{
		path: 'api/account/newemail/confirm',
		pathMatch: 'full',
		component: DashboardComponent
	},
	{
		path: 'api/account/password/reset',
		pathMatch: 'full',
		component: DashboardComponent
	},
	{
		path: 'api/site/contributor/accept',
		pathMatch: 'full',
		component: DashboardComponent
	},

	{
		path: 'dashboard',
		pathMatch: 'full',
		component: DashboardComponent
	},
	{
		path: 'account/email/confirm',
		pathMatch: 'full',
		component: DashboardComponent
	},
	{
		path: 'detail',
		loadChildren: './component/ws-detail/ws-detail.module#WSDetailModule'
	},
	{
		path: 'sitemap',
		loadChildren:
			'./component/common/sitemap/sitemap.route.module#SitemapRouteModule'
	},
	{
		path: 'my_account/:id',
		loadChildren:
			'./component/account/account.module#AccountModule'
	},
	{ path: '**', component: DashboardComponent }
];

export const routing = RouterModule.forRoot(routes);

// export const routing = RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: IdlePreload });
