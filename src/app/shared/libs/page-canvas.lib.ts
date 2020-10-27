import { HttpEventType } from '@angular/common/http';
import { RouterStateSnapshot } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import {
	cloneDeep as _cloneDeep,
	differenceBy as _differenceBy,
	findIndex as _findIndex,
	find as _find,
	get as _get,
	head as _head,
	max as _max,
	min as _min,
	indexOf as _indexOf,
	isEqual as _isEqual,
	intersection as _intersection,
	nth as _nth,
	pick as _pick,
	size as _size,
	sortBy as _sortBy,
	uniq as _uniq,
} from 'lodash';
import { catchError, filter, map, tap, mergeMap, takeUntil } from 'rxjs/operators';

import * as html2canvas from 'html2canvas';

import * as imageUrl from '@app-lib/functions/image-url';
import { UUID } from '@app-lib/uuid/uuid.service';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import * as omitDeep from '@app-lib/functions/omit-deep';
import { NonGlobalItemsServices } from '@app-shared/constants';
import {
	createSitemapSaveWindow,
	SitemapSaveComponent
} from '@app-common/sitemap/sitemap-save/sitemap-save.component';
import { createAddThemeToWebsiteDialogWindow } from '@app-dialogs/add-theme-to-website-dialog/add-theme-to-website-dialog.component';

import {
	Item,
} from '@app/models';
import { DialogWindow } from '@app/component/common/window/window.service';

var canvg = require('canvg-browser');
const Find = require('find-key');

export const callSavePage = (
	canvasComponent: any,
	isNewPage,
	clone_page,
	thumb,
	nextState,
	changedHeader,
	changedFooter,
	changedBody,
	appService,
	sitemapService,
	alertService,
	treeService,
	afterSave: (canvasComponent) => void,
	onCancelled: (canvasComponent) => void,
	gotoNavigation: (e, canvasComponent, savedPage) => void,
	loadingComponent,
	callingAPI,
	cancelled,
) => {
	let savedPage: any;

	if (isNewPage) {
		callingAPI = sitemapService
			.addPage(clone_page, thumb)
			.subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							break;
						case HttpEventType.UploadProgress:
							// Compute and show the % done:
							if (loadingComponent)
								loadingComponent.set(
									Math.min(50 + (event.loaded / event.total) * 50, 98)
								);
							break;
						case HttpEventType.Response:
							// if (this.pageResult['service']==16)
							//		 this.store.dispatch({ type: 'SET_CURRENT_DRAFT', payload: {draft: true} });
							if (loadingComponent) loadingComponent.complete();

							savedPage = _get(event, ['body']);

							if (savedPage) {
								alertService.playToast('Success', 'Page is saved.', 0);
								appService._currentPage = null;
								appService.siteMaxPageNo = savedPage['siteMaxPageNo'] || appService.siteMaxPageNo;

								const serviceItems = appService.getServiceItem(
											savedPage,
											clone_page.service
										);
								if (serviceItems && serviceItems.length > 0) {
									if (savedPage.service == 20) {
									} else {
										(serviceItems[0]
											.content as any).info.value = savedPage.serviceObject;
									}
								}

								if (afterSave)
									afterSave(canvasComponent);

								if (!!appService._themePage || changedHeader || changedFooter || changedBody) {
									appService.refreshThumbnails.next([
										savedPage.uid,
										savedPage.listingUid,
										changedHeader,
										changedFooter
									]);
								}

								if (gotoNavigation)
									gotoNavigation(nextState, canvasComponent, savedPage);

								if (savedPage.num)
									appService._changePageNo.next(savedPage.num);

								if (savedPage && savedPage['status'] == 'Active') {
									appService.publishSiteSub.next(true);
								}

							} else {
								alertService.playToast(
									'Failed',
									'Page is not saved.',
									1
								);
								onCancelled(canvasComponent);
							}
							break;
					}
				},
				error => {
					console.log(error);
					alertService.playToast('Failed', 'Page is not saved.', 1);
					onCancelled(canvasComponent);
				},
				() => {}
			);
	} else {
		console.log(clone_page);
		callingAPI = sitemapService
			.updatePage(clone_page, thumb)
			.subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							break;
						case HttpEventType.UploadProgress:
							if (loadingComponent)
								loadingComponent.set(
									Math.min(50 + (event.loaded / event.total) * 50, 98)
								);
							break;
						case HttpEventType.Response:
							if (loadingComponent) loadingComponent.complete();
							if (event.body) {
								savedPage = event.body;
								alertService.playToast('Success', 'Page is updated.', 0);
								appService.siteMaxPageNo = savedPage['siteMaxPageNo'] || appService.siteMaxPageNo;

								const serviceItems = appService.getServiceItem(
										savedPage,
										clone_page.service
									);

								if (serviceItems && serviceItems.length > 0) {
									if (savedPage.service == 20) {
									} else {
										(serviceItems[0]
											.content as any).info.value = savedPage.serviceObject;
									}
								}
								if (changedHeader || changedFooter || changedBody) {
									appService.refreshThumbnails.next([
										savedPage.uid,
										savedPage.listingUid,
										changedHeader,
										changedFooter
									]);
								}

								if (gotoNavigation)
									gotoNavigation(nextState, canvasComponent, savedPage);

								if (savedPage.num)
									appService._changePageNo.next(savedPage.num);

								if (savedPage && savedPage['status'] == 'Active') {
									appService.publishSiteSub.next(true);
								}
							} else {
								alertService.playToast(
									'Failed',
									'Page is not updated.',
									1
								);
								onCancelled(canvasComponent);
							}
							break;
						}
					},
					error => {
						console.log(error);
						alertService.playToast('Failed', 'Page is not updated.', 1);
						onCancelled(canvasComponent);
					},
					() => {}
				);
		}
};

export const saveGlobalItems = (
	canvasComponent: any,
	isNewPage,
	clone_page,
	thumb,
	nextState,
	gItems,
	lGH,
	lGF,
	mGH,
	mGF,
	appService,
	sitemapService,
	alertService,
	treeService,
	afterSave: (canvasComponent) => void,
	onCancelled: (canvasComponent) => void,
	gotoNavigation: (e, canvasComponent) => void,
	loadingComponent,
	callingAPI,
	cancelled,
) => {
	if (NonGlobalItemsServices.indexOf(clone_page.service) >= 0) {
		callSavePage(
			canvasComponent,
			isNewPage,
			clone_page,
			thumb,
			nextState,
			false,
			false,
			false,
			appService,
			sitemapService,
			alertService,
			treeService,
			afterSave,
			onCancelled,
			gotoNavigation,
			loadingComponent,
			callingAPI,
			cancelled,
		);
		return;
	}
	let newGItems = [];
	let updateGItems = [];
	let deleteGItems = [];
	let originalHFItems = [];
	let originalGItems: Item[] = appService._globalItems;
	let changedHeader = false;
	let changedFooter = false;
	let changedBody = false;

	originalGItems = originalGItems.filter((i: Item) => {
		if (i.itemType == 'HFItem') {
			originalHFItems.push(i);
			const temp =
				i.hf == 1
					? i.content.mView < 3
						? lGH
						: mGH
					: i.content.mView < 3
						? lGF
						: mGF;
			if (temp &&	(differenceDeep.isDifference(temp, i, [
					'id',
					'listingUid',
					'visible',
					'box'
				]) || temp.content.box.height() != i.content.box.height())
			) {
				updateGItems.push(temp);
			}
			return false;
		} else if (i.hf > 0) {
			if (!lGH && i.content.mView < 3 && i.hf == 1) return false;
			if (!lGF && i.content.mView < 3 && i.hf == 2) return false;
			if (!mGH && i.content.mView == 3 && i.hf == 1) return false;
			if (!mGF && i.content.mView == 3 && i.hf == 2) return false;
		}

		const temp: Item = gItems.find(gi => gi.uid == i.uid);
		if (temp &&
			(differenceDeep.isDifference(temp, i, temp.hf > 0 ? ['id', 'listingUid'] : ['id', 'listingUid', 'box'])
			|| temp.hf > 0 && temp.content.box.height() != i.content.box.height())
		) {
			updateGItems.push(temp);
		}
		return true;
	});

	newGItems = _differenceBy(gItems, originalGItems, 'uid');
	// newGItems = gItems;
	if (lGH && originalHFItems.findIndex(i => i.uid == lGH.uid) < 0)
		newGItems.push(lGH);
	if (lGF && originalHFItems.findIndex(i => i.uid == lGF.uid) < 0)
		newGItems.push(lGF);
	if (mGH && originalHFItems.findIndex(i => i.uid == mGH.uid) < 0)
		newGItems.push(mGH);
	if (mGF && originalHFItems.findIndex(i => i.uid == mGF.uid) < 0)
		newGItems.push(mGF);
	// newGItems = gItems.concat(appService._globalItems.filter(i => i.itemType == 'HFItem'));
	deleteGItems = _differenceBy(
		originalGItems.filter(
			i =>
				i.itemType != 'HFItem' &&
				clone_page.unplacedGlobalItems.indexOf(i.uid) < 0
		),
		gItems,
		'uid'
	);

	updateGItems = _differenceBy(updateGItems, newGItems, 'uid');
	// updateGItems = [];
	updateGItems.forEach(i => {
		let temp = originalGItems.find(gi => gi.uid == i.uid);
		if (temp) {
			if (!changedHeader && temp.hf == 1) changedHeader = true;
			if (!changedFooter && temp.hf == 2) changedFooter = true;
			if (!changedBody && temp.hf == 0) changedBody = true;
		}
	});

	console.log('update -- Items', updateGItems);
	console.log('add -- Items', newGItems);
	console.log('delete -- Items', deleteGItems);
	console.log('global items in this page', gItems);
	console.log('global items in the store', appService._globalItems);

	newGItems.forEach(item => {
		if (!item.listingUid && treeService._currentTrees['sitemap'])
			item.listingUid = treeService._currentTrees['sitemap'].value[
				'uid'
			];
	});

	const savedGlobalItems: Promise<boolean>[] = [];
	const deleteGlobalItems: Promise<boolean>[] = [];

	if (newGItems.length > 0) {
		if (!changedHeader && newGItems.find(i => i.hf == 1))
			changedHeader = true;
		if (!changedFooter && newGItems.find(i => i.hf == 2))
			changedFooter = true;
		if (
			!changedBody &&
			newGItems.find(i => i.hf == 0 && i.content.box.top < 768)
		)
		changedBody = true;
		savedGlobalItems.push(
			appService
				.addComponents(newGItems)
				.map(res => {
					for (let i = 0; i < res.length; i++) {
						const temp = clone_page.items.findIndex(ci => ci.uid == res[i].uid);
						if (temp >= 0) clone_page.items[temp].uid = res[i].uid;
						appService._globalItems = [
							...appService._globalItems,
							appService.createItem(res[i])
						];
						console.log('added GlobalItems');
					}
					return true;
				})
				.catch((err, obs) => {
					console.log(err);
					return Observable.of(false);
				})
				.toPromise()
		);
	}

	updateGItems.forEach(item => {
		savedGlobalItems.push(
			appService
				.updateComponents(item)
				.map(res => {
					const index = _findIndex(
						appService._globalItems,
						_pick(item, 'uid')
					);
					if (index >= 0) {
						appService._globalItems.splice(
							index,
							1,
							_cloneDeep(item)
						);
					}
					return true;
				})
				.catch((err, obs) => {
					return Observable.of(false);
				})
				.toPromise()
		);
	});

	Promise.all(savedGlobalItems).then(sValue => {
		deleteGItems.forEach((item, i) => {
			if (!changedHeader && item.hf == 1) changedHeader = true;
			if (!changedFooter && item.hf == 2) changedFooter = true;
			if (!changedBody && item.hf == 0) changedBody = true;
			deleteGlobalItems.push(
				appService
					.deleteComponents(item.uid)
					.map(res => {
						appService._globalItems = appService._globalItems.filter(
							i => i.uid != item.uid
						);
						console.log('deleted GlobalItems', res);
						return true;
					})
					.catch((err, obs) => {
						return Observable.of(false);
					})
					.toPromise()
			);
		});
		Promise.all(deleteGlobalItems).then(dValue => {
			callSavePage(
				canvasComponent,
				isNewPage,
				clone_page,
				thumb,
				nextState,
				changedHeader,
				changedFooter,
				changedBody,
				appService,
				sitemapService,
				alertService,
				treeService,
				afterSave,
				onCancelled,
				gotoNavigation,
				loadingComponent,
				callingAPI,
				cancelled,
			);
		});
	});
};

export const onSavePage = (
	canvasComponent: any,
	nextState: RouterStateSnapshot,
	appService,
	sitemapService,
	alertService,
	treeService,
	windowService,
	afterSave: (canvasComponent) => void,
	onCancelled: (canvasComponent) => void,
	gotoNavigation: (e, canvasComponent) => void,
	refreshView: (e, t, canvasComponent) => void,
	restorePage: (canvasComponent) => void,
	currentSite,
	loadingComponent,
	callingAPI,
	cancelled,
	clone_page,
	thumb,
	resultHFItems,
	backgroundInfo,
) => {
	const gItems: Item[] = [];
	let lGH: Item; // Laptop Global Header
	let lGF: Item; // Laptop Global Footer
	let mGH: Item; // Mobile Global Header
	let mGF: Item; // Mobile Global Footer
	let id = -1;

	let isNewPage = true;

	if (clone_page.uid == '') {
		clone_page.siteId = 0;
		clone_page.id = 0;

		if (!!appService._themePage) {
			clone_page['themeUid'] = appService._themePage.themeUid;
			clone_page['uid'] = appService._themePage.uid;
		} else {
			clone_page.uid = UUID.UUID();
		}

	} else {
		isNewPage = false;
	}

	clone_page.items.forEach((i: Item) => {
		i.id = ++id;
		if (i.global && i.itemType != 'HFItem') {
			gItems.push(_cloneDeep(i));
		} else if (i.global && i.itemType == 'HFItem') {
			// If it is a global Header/Footer
			if (i.hf == 1) {
				i.content.mView < 3 ? (lGH = i) : (mGH = i);
			} else {
				i.content.mView < 3 ? (lGF = i) : (mGF = i);
			}
		}

		if (i.itemType == 'TextItem') {
			const temp = i.content['text'].match(/pageUid&quot;:&quot;(.+)&quot;,/g);
			if (temp)
				temp.forEach((t: string) => {
					const f = t.indexOf(':&quot;');
					const l = t.indexOf('&quot;,');
					if (l > f + 7)
						clone_page.linkUids.push(t.substr(f + 7, l - f - 7));
				});
		} else if (i.itemType != 'HFItem') {
			const uids = Find(i, 'pageUid');
			if (uids.length > 0) {
				clone_page.linkUids.push(...uids);
			}
		}
	});

	clone_page.linkUids = _uniq(clone_page.linkUids);
	clone_page.background = backgroundInfo;
	clone_page.hasImages = appService.hasImages(clone_page);

	const serviceItems: Item[] = appService.getServiceItem(
				clone_page,
				clone_page.service
			);

	if (serviceItems && serviceItems.length > 0) {
		if (clone_page.service == 20) {
			let pUids = [];
			let showNavigation = false;
			let layoutType = 1;
			let listingUids = [null, null, null];
			serviceItems.forEach((si, index) => {
				si.content['info'].value = omitDeep.omitDeep(
					si.content['info'].value,
					[
						'activeProduct',
						'activeListingUid',
						'viewDetail',
						'page',
						'products',
						'listings',
						'prevBox'
					]
				);
				layoutType = _get(si, ['content', 'info', 'value', 'layoutType']);
				listingUids = _get(si, ['content', 'info', 'value', 'listingUids']);
				if (
					layoutType != 3 &&
					si.content['info'].value.showNavigation
				) {
					si.content['info'].value.productUids = [];
					showNavigation = true;
				} else {
					si.content['info'].value.productUids = si.content[
						'info'
					].value.productUids.filter(uid => uid != '');
					pUids = pUids.concat(_get(si, ['content', 'info', 'value', 'productUids']));
				}
			});

			clone_page.serviceObject = {
					layoutType: layoutType,
					productUids: pUids,
					initViewNum: 8,
					showNavigation: showNavigation,
					listingUids: listingUids
				};
		} else {
			clone_page.serviceObject = serviceItems[0].content['info'].value;

			if (clone_page.service == 22) {
				delete serviceItems[0].content['info'].value['json'];
				const temp = _cloneDeep(serviceItems[0].content['info'].value);
				temp['uid'] = clone_page.uid;
				clone_page.serviceObject['json'] = JSON.stringify(temp);
			}
		}
		// console.log(
		//	 'service object',
		//	 JSON.stringify(clone_page.serviceObject)
		// );
	}

	if (clone_page.serviceObject)
		clone_page.serviceObject.uid = clone_page.uid;
	else
		clone_page.serviceObject = { uid: clone_page.uid };
		
	// set the postions of global items for laptop
	if (
		resultHFItems[0] &&
		resultHFItems[0].content['visible']
	) {
		appService.getGlobalItemPosition(
			gItems,
			resultHFItems[0],
			false
		);
	}

	if (mGH && mGH.content['visible']) {
		appService.getGlobalItemPosition(gItems, mGH, true);
	}
	// save
	if (isNewPage) {
		if (
			(appService._currentSite &&
				appService._currentSite.roleId > 1) ||
			[10, 13, 15, 16].indexOf(clone_page.service) < 0
		) {
			let sitemapSaveDialog;
			sitemapSaveDialog = createSitemapSaveWindow(
				windowService,
				thumb,
				clone_page.display == 'Mobile'
			);
			sitemapSaveDialog.componentRef.instance.submit.subscribe(
				res => {
					sitemapSaveDialog.destroy();
					clone_page.listingUid = res;
					saveGlobalItems(
						canvasComponent,
						true,
						clone_page,
						thumb,
						nextState,
						gItems,
						lGH,
						lGF,
						mGH,
						mGF,
						appService,
						sitemapService,
						alertService,
						treeService,
						afterSave,
						onCancelled,
						gotoNavigation,
						loadingComponent,
						callingAPI,
						cancelled,
					);
				}
			);
			sitemapSaveDialog.componentRef.instance.close.subscribe(() => {
				sitemapSaveDialog.destroy();
				onCancelled(canvasComponent);
			});
			sitemapSaveDialog.open();
		} else {
			saveGlobalItems(
				canvasComponent,
				true,
				clone_page,
				thumb,
				nextState,
				gItems,
				lGH,
				lGF,
				mGH,
				mGF,
				appService,
				sitemapService,
				alertService,
				treeService,
				afterSave,
				onCancelled,
				gotoNavigation,
				loadingComponent,
				callingAPI,
				cancelled,
			);
		}
	} else {
		saveGlobalItems(
			canvasComponent,
			false,
			clone_page,
			thumb,
			nextState,
			gItems,
			lGH,
			lGF,
			mGH,
			mGF,
			appService,
			sitemapService,
			alertService,
			treeService,
			afterSave,
			onCancelled,
			gotoNavigation,
			loadingComponent,
			callingAPI,
			cancelled,
		);
	}
};

export const onSave = (
	canvasComponent: any,
	nextState: RouterStateSnapshot,
	appService,
	sitemapService,
	alertService,
	treeService,
	windowService,
	createAccount: (canvasComponent) => void,
	cleanPage: (canvasComponent) => void,
	clickCanvasTool: (item: string, full?: boolean) => void,
	afterSave: (canvasComponent) => void,
	onCancelled: (canvasComponent) => void,
	gotoNavigation: (e, canvasComponent) => void,
	refreshView: (e, t, canvasComponent) => void,
	restorePage: (canvasComponent) => void,
	currentSite,
	loadingComponent,
	callingAPI,
	cancelled,
	pageLayout,
	canvasElem,
	thumbEle,
	resultHFItems,
	backgroundInfo,
) => {
	let timeout = 0;
	cancelled = false;

	if (!currentSite) {
		console.log('create account');
		createAccount(canvasComponent);
		return;
	}

	if (appService._currentPage.display == 'Laptop' && pageLayout == 2) {
		clickCanvasTool('PageLayout1');
		timeout = 500;
	} else if (appService._currentPage.display == 'Mobile' && pageLayout == 1) {
		clickCanvasTool('PageLayout2');
		timeout = 500;
	}

	if (cleanPage) {
		cleanPage(canvasComponent);
	}

	if (refreshView) {
		refreshView(true, 'Saving...', canvasComponent);
	}

	appService._savingPage = true;

	setTimeout(() => {
		if (!appService._currentPage) {
			alertService.playToast('Failed', 'You can not save this page.', 1);
			onCancelled(canvasComponent);
			return;
		}

		let progress = 0;
		const timer = Observable.interval(100);
		const sub = timer.subscribe(res => {
			progress = Math.min(progress + 5, 50);
			if (loadingComponent) loadingComponent.set(progress);
		});

		let clonePageContainer: HTMLElement;
		let clone: HTMLElement;

		[clonePageContainer, clone] = appService.createThumbnailElement(
			document.body,
			thumbEle ? thumbEle : canvasElem,
			appService._currentPage.display == 'Laptop' ? 1100 : 320,
			appService._currentPage.display == 'Laptop' ? 768 : 445
		);

		const elements = $(clone)
			.find('svg')
			.map(function() {
				const svg = $(this);
				const canvas = $('<canvas></canvas>').css({
					position: 'absolute',
					left: svg.css('left'),
					top: svg.css('top')
				});
				svg.replaceWith(canvas);
				// Get the raw SVG string and curate it
				const content = svg
					.wrap('<p></p>')
					.parent()
					.html();
				svg.unwrap();
				canvg(canvas[0], content);

				return {
					svg: svg,
					canvas: canvas
				};
			});

		setTimeout(() => {
			if (cancelled) return;
			const scale =
				280 /
				(thumbEle
					? thumbEle.offsetWidth
					: canvasElem.offsetWidth);
			html2canvas(clone, {
				allowTaint: false,
				useCORS: true,
				logging: false,
				imageTimeout: 0,
				backgroundColor: '#FFFFFF',
				scale: scale
			}).then(canvas => {
					if (cancelled) return;
					const dataImage = canvas.toDataURL('image/jpeg', 0.92); //image/png
					// let dataImage = canvas.toDataURL('image/png'); //image/png
					const thumb = appService.dataURLtoFile(
						dataImage,
						'thumbnail.png'
					);

					let page = appService._currentPage;

					sub.unsubscribe();

					if (restorePage) {
						restorePage(canvasComponent);
					}

					if (clonePageContainer)
						document.body.removeChild(clonePageContainer);
					clonePageContainer = null;

					const clone_page = _cloneDeep(page);
					clone_page.items.push(...appService._mobilePage.items); // tablet items + mobile items
					clone_page.unplacedGlobalItems.push(
						...appService._mobilePage.unplacedGlobalItems
					);
					clone_page.unplacedGlobalItems = _uniq(
						clone_page.unplacedGlobalItems
					);

					const isSystem = appService._currentSite && appService._currentSite.roleId > 1;

					if (!isSystem && appService._editingThemeListingUid) {
						let themeHFItems: any = clone_page.items.filter(gi => gi.listingUid == appService._editingThemeListingUid && gi.hf > 0);
						let appServiceHFItems: any = appService._globalItems.filter(gi => gi.listingUid != appService._editingThemeListingUid && gi.hf > 0);

						if (themeHFItems.length && appServiceHFItems.length) {
							const dialog = createAddThemeToWebsiteDialogWindow(this._windowService);
							dialog.componentRef.instance.submit.subscribe((result: any) => {
								dialog.destroy();
								if (result == 'keep') {
									clone_page.items = clone_page.items.filter(gi => gi.hf == 0);
									clone_page.items.push(...appServiceHFItems);
								}
								onSavePage(
									canvasComponent,
									nextState,
									appService,
									sitemapService,
									alertService,
									treeService,
									windowService,
									afterSave,
									onCancelled,
									gotoNavigation,
									refreshView,
									restorePage,
									currentSite,
									loadingComponent,
									callingAPI,
									cancelled,
									clone_page,
									thumb,
									resultHFItems,
									backgroundInfo,
								);
							});

							dialog.componentRef.instance.close.subscribe(() => {
								dialog.destroy();
								onCancelled(canvasComponent);
							});
							dialog.open();
							return;
						} else if (appServiceHFItems.length) {
							clone_page.items.push(...appServiceHFItems);
						}
					}

					onSavePage(
						canvasComponent,
						nextState,
						appService,
						sitemapService,
						alertService,
						treeService,
						windowService,
						afterSave,
						onCancelled,
						gotoNavigation,
						refreshView,
						restorePage,
						currentSite,
						loadingComponent,
						callingAPI,
						cancelled,
						clone_page,
						thumb,
						resultHFItems,
						backgroundInfo,
					);
				})
				.catch(error => {
					console.log(error);
					alertService.playToast('Failed', 'Page is not saved.', 1);
					onCancelled(canvasComponent);
				});
		}, 1000);
	}, timeout);
};
