import { createFeatureSelector, createSelector, ActionReducer, Action } from '@ngrx/store';
import * as lodash from 'lodash';
import { UUID } from '@app-lib/uuid/uuid.service';
import { Rect, Box } from '@app-lib/rect/rect';
import { Page, Item, HFItemContent } from '@app/models'

export interface PagesState {
	pages: Page[],
	currentService: number,
	currentPage: Page,
	globalItems: Item[]    
}

export const initialPagesState: PagesState = {
	pages: [],
	currentService: null,
	currentPage: null,
	globalItems: []
}

export function PagesReducer (state: PagesState = initialPagesState, action: any): PagesState {	
	switch(action.type) {
		case 'CURRENT_SERVICE':
			return { ...state, ...{ currentService: action.payload.service } };

		case 'CLEAR_PAGES_STATE':
            return initialPagesState;

		case 'SET_PAGE_GLOBAL_ITEMS':
            return { ...state, ...{ globalItems: action.payload.globalItems} };
            
        case 'ADD_PAGE_GLOBAL_ITEMS':			
            if (action.payload.globalItems)
                return {...state, ...{ globalItems: [...action.payload.globalItems, ...state.globalItems]}};
            return state;

		case 'UPDATE__PAGE_GLOBAL_ITEMS':			
            if (action.payload.globalItems)
                return {...state, ...{ globalItems: [...action.payload.globalItems, ...state.globalItems.filter(item=>action.payload.globalItems.findIndex(i=>i.uid == item.uid) < 0)]}};
            return state;

        case 'DELETE_PAGE_GLOBAL_ITEMS':            
            return {...state, ...{ globalItems: state.globalItems.filter(item=>action.payload.globalItems.findIndex(gItem=>gItem.uid == item.uid) < 0)}};

        case 'ADD_PAGE':
            if (action.payload.page)            
                return { ...state, ...{ pages: [action.payload.page, ...state.pages] } };
            return state;

		case 'UPDATE_PAGE':
			if (action.payload.page) {
				state.pages = [action.payload.page, ...state.pages.filter(page=>page.uid != action.payload.page.uid)];
				return {...state, ...{pages: state.pages}};
			}
			return state;
            
		case 'DELETE_PAGE':            
            return {...state, ...{pages: state.pages.filter(page=>page !== action.payload.page)}};
            
		case 'SET_CURRENT_PAGE':
            return {...state, ...{currentPage: action.payload.page}};

		default:
			return state;
    }    
};

export const getPagesState = createFeatureSelector<PagesState>('pages');

export const getPages = createSelector(
    getPagesState,
    (state: PagesState) => state.pages
);

export const getServicePages = createSelector(
    getPagesState,
    (state: PagesState) => state.pages.filter(page=>page.service == state.currentService)
);

export const getGlobalItems = createSelector(
	getPagesState,
    (state: PagesState) => state.globalItems.filter(item=>item.service == state.currentService)
);

export const getCurrentPage = createSelector(
    getPagesState,
    (state: PagesState) => state.currentPage
);

export const getCurrentService = createSelector(
    getPagesState,
    (state: PagesState) => state.currentService
);
