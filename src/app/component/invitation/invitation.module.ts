import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { InvitationCanvasModule } from '@app/component/invitation/invitation-canvas/invitation-canvas.module';
import { InvitationCanvasPreviewModule } from '@app/component/invitation/invitation-canvas-preview/invitation-canvas-preview.module';
import { MyInvitationModule } from '@app/component/invitation/my-invitation/my-invitation.module';
import { routing } from '@app/component/invitation/invitation.routes';

@NgModule({
	declarations: [],
	exports: [],
	imports: [
		SharedModule,
		InvitationCanvasModule,
		InvitationCanvasPreviewModule,
		MyInvitationModule,		
		routing
	],
	providers: [		
	]
})
export class InvitationModule { }