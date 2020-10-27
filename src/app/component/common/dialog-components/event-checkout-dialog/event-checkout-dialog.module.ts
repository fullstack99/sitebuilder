import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';

import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { QualifyParticipantDialogModule } from '@app-dialogs/event-setup-dialog/event-activities/qualify-participant-dialog/qualify-participant-dialog.module';
import { EventAddToCartComponent } from './event-add-to-cart/event-add-to-cart.component';
import { EventCheckoutComponent } from './event-checkout/event-checkout.component';
import { EventCheckoutDialogComponent } from './event-checkout-dialog.component';

@NgModule({
	declarations: [
		EventAddToCartComponent,
		EventCheckoutComponent,
		EventCheckoutDialogComponent
	],
	exports: [
		EventAddToCartComponent,
		EventCheckoutComponent,
		EventCheckoutDialogComponent
	],
	imports: [
		SharedModule,
		FeedbackDialogModule,
		LoadingModule,
		CheckboxModule,
		DropDownModule,
		QualifyParticipantDialogModule,
	],
	providers: [
	],
	entryComponents: [
		EventAddToCartComponent,
		EventCheckoutComponent,
		EventCheckoutDialogComponent
	]
})
export class EventCheckoutDialogModule {}
