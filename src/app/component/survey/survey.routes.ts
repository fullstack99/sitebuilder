import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { SurveyComponent} from '@app/component/survey/survey.component';

const routes: Routes = [
    { path: '', redirectTo: '1' },
    { path: '1', loadChildren: '../common/themes/themes.module#ThemesModule', data: { themesName: 'survey', tabId: '19' } },
	  { path: '2', component: SurveyComponent, canDeactivate: [CanDeactivateGuard] },
    { path: '3', loadChildren: '../common/page-canvas/preview/page-canvas-preview.module#PageCanvasPreviewModule'},
    { path: '4', loadChildren: '../common/share/share.module#ShareModule', data: { title: 'Survey' } }
];

export const routing = RouterModule.forChild(routes);
