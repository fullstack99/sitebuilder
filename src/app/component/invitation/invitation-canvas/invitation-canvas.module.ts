import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';

import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { PageCanvasToolsModule } from '@app-common/page-canvas/tools/page-canvas-tools.module';
import { PageCanvasModule } from '@app-common/page-canvas/page-canvas.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { InviteSetupDialogModule } from '@app-dialogs/invite-setup-dialog/invite-setup-dialog.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { ResendConfirmDialogModule } from '@app/component/invitation/resend-confirm/resend-confirm.module';
import { InvitationCanvasComponent } from '@app/component/invitation/invitation-canvas/invitation-canvas.component';

@NgModule({
    imports: [
        SharedModule,        
        DropDownModule,
        RadioGroupModule,
        PageCanvasToolsModule,
        PageCanvasModule,        
        DraggableListInlineModule,        
        InviteSetupDialogModule,        
        GoogleMapsDialogModule,
        ResendConfirmDialogModule
    ],
    declarations: [
        InvitationCanvasComponent,
    ],
    exports: [
        InvitationCanvasComponent,
    ],
    providers: [        
    ]
})

export class InvitationCanvasModule {

}