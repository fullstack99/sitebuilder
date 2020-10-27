import { createFeatureSelector, createSelector, ActionReducer, Action } from '@ngrx/store';
import * as lodash from 'lodash';
import { Page, Item, BlogInfo, BlogEntry } from '@app/models'

export interface BlogsState {
    blogs: BlogInfo[],
    currentBlog: BlogInfo,
    currentBlogDraft: boolean,
	globalItems: Item[]    
}

const blogInitialState: BlogsState = {
    blogs: [] = [
        new BlogInfo('Blog 1', new Date()),
        new BlogInfo('Blog 2', new Date()),
        new BlogInfo('Blog 3', new Date()),
        new BlogInfo('Blog 4', new Date()),
    ],
    currentBlog: null,
    currentBlogDraft: false,
	globalItems: []
}

export function BlogsReducer (state: BlogsState = blogInitialState, action: any): BlogsState {
	switch(action.type) {
        case 'CLEAR_BLOGS_STATE':
            return blogInitialState;

		case 'SET_BLOG_GLOBAL_ITEMS':
            return { ...state, ...{ globalItems: action.payload.globalItems} }
            
        case 'ADD_BLOG_GLOBAL_ITEMS':			
            if (action.payload.globalItems)
                return {...state, ...{ globalItems: [...action.payload.globalItems, ...state.globalItems]}};
            return state;

		case 'UPDATE_BLOG_GLOBAL_ITEMS':			
            if (action.payload.globalItems)
                return {...state, ...{ globalItems: [...action.payload.globalItems, ...state.globalItems.filter(item=>action.payload.globalItems.findIndex(i=>i.uid == item.uid) < 0)]}};
            return state;

        case 'DELETE_BLOG_GLOBAL_ITEMS':            
            return {...state, ...{ globalItems: state.globalItems.filter(item=>action.payload.globalItems.findIndex(gItem=>gItem.uid == item.uid) < 0)}};

        case 'ADD_BLOG':
            if (action.payload.blog)
                return { ...state, ...{ blogs: [action.payload.blog, ...state.blogs] } };
            return state;

        case 'UPDATE_BLOG':
            if (action.payload.blog) {
                state.blogs = [action.payload.blog, ...state.blogs.filter(blog=>blog.uid != action.payload.blog.uid)];
                return {...state, ...{ blogs: state.blogs}};
            }
            return state;            
            
		case 'DELETE_BLOG':            
            return {...state, ...{ blogs: state.blogs.filter(blog=>blog !== action.payload.blog)}};
            
		case 'SET_CURRENT_BLOG':			
            return {...state, ...{ currentBlog: action.payload.blog, currentBlogDraft: action.payload.draft }};
        
        case 'SET_CURRENT_DRAFT':
            return {...state, ...{ currentBlogDraft: action.payload.draft }};

		default:
			return state;
	}
};

export const getBlogsState = createFeatureSelector<BlogsState>('blogs');

export const getBlogs = createSelector(
    getBlogsState,
    (state: BlogsState) => state.blogs
);

export const getCurrentBlog = createSelector(
    getBlogsState,
    (state: BlogsState) => state.currentBlog
);

export const getCurrentBlogDraft = createSelector(
    getBlogsState,
    (state: BlogsState) => state.currentBlogDraft
)

export const getBlogGlobalItems = createSelector(
	getBlogsState,
    (state: BlogsState) => state.globalItems
);
