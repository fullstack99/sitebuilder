import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { AppointmentComponent } from '@app/component/appointment/appointment.component';

const routes: Routes = [
    { path: '', redirectTo: '1' },
    { path: '1', loadChildren: '../common/themes/themes.module#ThemesModule', data: { themesName: 'appt. scheduler', tabId: 23 } },
	{ path: '2', component: AppointmentComponent, canDeactivate: [CanDeactivateGuard] },
    { path: '3', loadChildren: '../common/page-canvas/preview/page-canvas-preview.module#PageCanvasPreviewModule'},
    { path: '4', loadChildren: './calendar/calendar.module#CalendarModule'},
    { path: '5', loadChildren: './calendar/calendar1.module#CalendarModule'}
];

export const routing = RouterModule.forChild(routes);
