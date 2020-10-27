import { createFeatureSelector, createSelector, ActionReducerMap, ActionReducer, MetaReducer, Store } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Params } from '@angular/router';
import * as fromRouter from '@ngrx/router-store';

// import * as itemMenus from './ecommerce/items/items-menu.reducer';
// import * as fromItems from './ecommerce/items/items.reducer';
import * as surveys from '@app/stores/reducers/survey/survey.reducer';
import * as sitemap from '@app/stores/reducers/sitemap/sitemap.reducer';
import * as globalItems from '@app/stores/reducers/global-items/global-items.reducer';
import * as youtube from '@app/stores/reducers/videos/youtube.reducer';
import * as pages from '@app/stores/reducers/pages/pages.reducer';
import * as blogs from '@app/stores/reducers/blogs/blogs.reducer';

export * from '@app/stores/reducers/pages/pages.reducer';
export * from '@app/stores/reducers/blogs/blogs.reducer';

export interface RouterStateUrl {
	url: string;
	queryParams: Params;
	params: Params;
}

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
	return localStorageSync({
		  keys: Object.keys(reducers),
		  rehydrate: true
	})(reducer);
}

// export const metaReducers: MetaReducer<any, any>[] = [localStorageSyncReducer];
export const metaReducers: MetaReducer<any, any>[] = [];

export interface AppState {
	// itemMenus: ItemMenu[];
	// items: {}; 
	// surveys: {};
	globalItems: {};
	youtube: youtube.YoutubeUserProfileState;
	sitemap: {},
	pages: {},
	blogs: {},
	routerReducer: fromRouter.RouterReducerState
	// multi_listing: {};
}

export const reducers: ActionReducerMap<AppState> = {	
	globalItems: globalItems.GlobalItemsReducer,
	youtube: youtube.YoutubeUserProfileReducer,	
	sitemap: sitemap.SitemapReducer,
	blogs: blogs.BlogsReducer,
	pages: pages.PagesReducer,
	routerReducer: fromRouter.routerReducer
}

export const getRouterState = createFeatureSelector<fromRouter.RouterReducerState>('routerReducer');
