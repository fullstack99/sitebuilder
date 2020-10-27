import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { ChooseComponent } from '@app-dialogs/choose-dialog/choose.component';
import { SchedulerService } from '@app/services';
import { WindowService } from '@app-common/window/window.service';

@NgModule({
	declarations: [		
		ChooseComponent,		
	],
	imports: [
		SharedModule,		
		RadioGroupModule		
	],	
	exports: [
		ChooseComponent
	],		
	providers: [
		SchedulerService,
		WindowService		
	],
	entryComponents: [
        ChooseComponent
    ]
})
export class ChooseDialogModule { }

