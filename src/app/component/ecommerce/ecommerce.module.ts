import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { PageCanvasModule } from '@app-common/page-canvas/page-canvas.module';
import { PageCanvasToolsModule } from '@app-common/page-canvas/tools/page-canvas-tools.module';

import { EcommerceComponent } from '@app/component/ecommerce/ecommerce.component';

const routing = RouterModule.forChild([
	{ path: '' , redirectTo: '1' },
	{ path: '1', loadChildren: '../common/themes/themes.module#ThemesModule', data: { themesName: 'ecommerce', tabId: 20 } },
	{ path: '2', component: EcommerceComponent, canDeactivate: [CanDeactivateGuard]},
	{ path: '3', loadChildren: '../common/page-canvas/preview/page-canvas-preview.module#PageCanvasPreviewModule'},
	{ path: '4', loadChildren: './promotions/ecommerce-promotions.module#EcommercePromotionsModule' },
	{ path: '5', loadChildren: './items/items.module#ItemsModule' },
	{ path: '6', loadChildren: './orders/ecommerce-orders.module#EcommerceOrdersModule' }
]);

@NgModule({
	declarations: [
	   EcommerceComponent
	],
	imports: [
	  SharedModule,
	  LoadingModule,
	  PageCanvasModule,
	  PageCanvasToolsModule,
	  routing
	],
	providers: [
	  // FontsService
	]
})
export class EcommerceModule {}
