import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '@app-shared/shared.module';
import { CanDeactivateGuard } from '@app/component/can-deactivate/can-deactivate.guard';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { ViewModule } from '@app-common/page-canvas/preview/view/view.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { ReplyModule } from '@app/component/invitation/reply/reply.module';
import { InvitationCanvasPreviewComponent } from '@app/component/invitation/invitation-canvas-preview/invitation-canvas-preview.component';

const routes: Routes = [
	{ path: '', component: InvitationCanvasPreviewComponent, canDeactivate: [CanDeactivateGuard] }
];

export const routing = RouterModule.forChild(routes);

@NgModule({
    imports: [
        SharedModule,
        AttentionDialogModule,        
        ViewModule,
        DraggableListInlineModule,
        LoadingModule,
        RadioGroupModule,
        GoogleMapsDialogModule,
        ReplyModule,
        routing
    ],
    declarations: [
        InvitationCanvasPreviewComponent,
    ],
    exports: [
        InvitationCanvasPreviewComponent,
    ],
    providers: []
})

export class InvitationCanvasPreviewModule {
}
