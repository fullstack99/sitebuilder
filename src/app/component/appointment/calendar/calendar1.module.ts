import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '@app-shared/shared.module';

import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { MenubarModule } from '@app-ui/menubar/menubar.module';
import { SchedulerModule } from '@app-ui/scheduler/scheduler.module';

import { CalendarComponent } from '@app/component/appointment/calendar/calendar1.component';
import { SchedulerService } from '@app/services';

const routes: Routes = [
	{ path: '', component: CalendarComponent }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

@NgModule({
	imports: [
		SharedModule,		
		LoadingModule,        
		DropDownModule,		
		MenubarModule,
		SchedulerModule,
		routing
	],
	declarations: [		
		CalendarComponent,		
	],
	exports: [
		CalendarComponent,		
	],
	entryComponents: [
		CalendarComponent,		
	],
	providers: [
		SchedulerService,		
	]
})
export class CalendarModule { }
