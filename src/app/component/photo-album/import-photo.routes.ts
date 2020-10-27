import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { ImportPhotoComponent } from '@app/component/photo-album/import-photo.component';

const routes: Routes = [
	{ path: '', redirectTo: '1' },	
	{ path: '1', loadChildren: '../common/themes/themes.module#ThemesModule', data: { themesName: 'album', tabId: '14' }  },
	{ path: '2', component: ImportPhotoComponent, canDeactivate: [CanDeactivateGuard] },
	{ path: '3', loadChildren: '../common/page-canvas/preview/page-canvas-preview.module#PageCanvasPreviewModule'},
	{ path: '4', loadChildren: '../common/share/share.module#ShareModule', data: { title: 'Photo Album' } },
	// { path: '5', redirectTo: '/detail/14/4' },
];

export const routing = RouterModule.forChild(routes);
