import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { PageCanvasModule } from '@app-common/page-canvas/page-canvas.module';
import { PageCanvasToolsModule } from '@app-common/page-canvas/tools/page-canvas-tools.module';
import { AppointmentComponent } from '@app/component/appointment/appointment.component';
import { routing } from '@app/component/appointment/appointment.routes';

export { AppointmentComponent } from '@app/component/appointment/appointment.component';

@NgModule({
	declarations: [ AppointmentComponent ],
	exports: [ AppointmentComponent ],
	imports: [
		SharedModule,		
		PageCanvasModule,
		PageCanvasToolsModule,
		routing
	],	
	providers: []
})
export class AppointmentModule { }
