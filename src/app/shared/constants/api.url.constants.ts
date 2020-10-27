export const SERVER_URL = 'https://api.glogood.com/';
// export const SERVER_URL = 'https://api3.glogood.com/';
export const APIs = {
	contact: SERVER_URL + 'api/contact',
	contact_list: SERVER_URL + 'api/contact/list',
	contact_in_list: SERVER_URL + 'api/contact/in_list',

	system: SERVER_URL + 'api/system',
	system_themes: SERVER_URL + 'api/system/themes',
	system_image: SERVER_URL + 'api/system/images',
	system_video: SERVER_URL + 'api/system/videos',
	system_image_categories: SERVER_URL + 'api/system/categories',
	page_image_rename: SERVER_URL + 'api/page/image/rename',

	component: SERVER_URL + 'api/component',
	component_update: SERVER_URL + 'api/component/update',
	component_clear: SERVER_URL + 'api/component/clear',

	page: SERVER_URL + 'api/page',
	page_thmbnails: SERVER_URL + 'api/page/thumbnails',
	page_details: SERVER_URL + 'api/page/details',
	page_update: SERVER_URL + 'api/page/update',
	page_update_sequence: SERVER_URL + '/api/page/update/sequence',
	page_update_sitemap: SERVER_URL + 'api/sitemap/update_page',
	page_publish: SERVER_URL + 'api/page/publish', // guid
	page_archive: SERVER_URL + 'api/page/status',  // 1: active, 2: archive
	page_site_copy: SERVER_URL + 'api/page/site/copy',  // copy page to a specific site
	photo_publish: SERVER_URL + 'api/page/publish', // guid

	site: SERVER_URL + 'api/site',
	sitemap: SERVER_URL + 'api/sitemap',
	sitemap_update: SERVER_URL + 'api/sitemap/update',
	sitemap_update_sequence: SERVER_URL + 'api/sitemap/update/sequence',
	sitemap_pages: SERVER_URL + 'api/sitemap/pages',

	blog: SERVER_URL + 'api/blog',
	blog_update: SERVER_URL + 'api/blog/update',
	blog_pages: SERVER_URL + 'api/blog/pages',

	image: SERVER_URL + 'api/image',
	nav: SERVER_URL + 'api/system/images/navigation/',
	file: SERVER_URL + 'api/file',
	keyword: SERVER_URL + 'api/keyword',

	feedback_insert: SERVER_URL + 'api/system/feedback',
	video: SERVER_URL + 'api/video',

	auth: SERVER_URL + 'connect/token',
	account: SERVER_URL + 'api/account',
	account_check_by_email: SERVER_URL + 'api/account/check_by_email',

	/* user_info
	Get: with Authorization: Bearer token
	*/
	user_info: SERVER_URL + 'api/userinfo',

	product: SERVER_URL + 'api/product',
	product_listing: SERVER_URL + 'api/productlisting',
	promotion: SERVER_URL + 'api/promotion',

	vendor: SERVER_URL + 'api/Vendor',
	invitation: SERVER_URL + 'api/invitation',
	invitation_list: SERVER_URL + 'api/invitation_list',
	invitation_guest: SERVER_URL + 'api/invitation_guest',
	invitation_guest_list: SERVER_URL + 'api/invitation/guest_list',
	content_email: SERVER_URL + 'api/content_email/send',
	service_stats: SERVER_URL + 'api/service/stats',
	scheduler: SERVER_URL + 'api/scheduler',
	freelancer: SERVER_URL + 'api/freelancer',
	freelancer_portfolio_sitemap: SERVER_URL + 'api/system/freelancer/listings',

	event: SERVER_URL + 'api/event',
};
