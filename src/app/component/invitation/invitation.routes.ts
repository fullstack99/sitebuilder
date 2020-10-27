import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { InvitationCanvasComponent } from '@app/component/invitation/invitation-canvas/invitation-canvas.component';

const routes: Routes = [
	{ path: '', redirectTo: '1' },
	{ path: '1', loadChildren: '../common/themes/themes.module#ThemesModule', data: { themesName: 'invitation', tabId: 15 } },
	{ path: '2', component: InvitationCanvasComponent, canDeactivate: [CanDeactivateGuard] },
	{ path: '3', loadChildren: './invitation-canvas-preview/invitation-canvas-preview.module#InvitationCanvasPreviewModule' },
	{ path: '4', loadChildren: './my-invitation/my-invitation.module#MyInvitationModule' },
	{ path: '5', loadChildren: '../common/share/share.module#ShareModule', data: { title: 'Invitation' } },
	{ path: '6', loadChildren: '../common/share/share.module#ShareModule', data: { title: 'Invitation' } },
];

export const routing = RouterModule.forChild(routes);