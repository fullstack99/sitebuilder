import { AttentionInfo } from '@app/models';

export const WARNING_UNSAVED: AttentionInfo = new AttentionInfo(
	{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
	[ 
		{ value: 'Your Changes are Unsaved', font_size: '16px', color: '#8c8c8c' },
		{ value: 'Would you like to Save?', font_size: '14px', color: '#8c8c8c' },
	],
	true,
	['Yes', 'No'],
	''
);	

export const WARNING_TITLE_MISSING: AttentionInfo = new AttentionInfo(
	{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
	[
		{ value: 'Choose Title for each Column', font_size: '14px', color: '#8c8c8c' },
		{ value: 'Some are missing', font_size: '14px', color: '#8c8c8c' },
	],
	true,
	['OK'],
	''
);

export const  WARNING_SITEMAP_DELETE: AttentionInfo = new AttentionInfo(
	{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
	[
		{ value: 'Pages will be deleted also', font_size: '14px', color: '#8c8c8c' },
		{ value: 'To keep the pages move them first to another Listing or Sub-Listing.', font_size: '14px', color: '#8c8c8c' },
	],
	true,
	['Yes', 'No'],
	''
);