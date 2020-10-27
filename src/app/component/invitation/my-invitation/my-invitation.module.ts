import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { SharedModule } from '@app-shared/shared.module';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';

import { MyInvitationComponent } from '@app/component/invitation/my-invitation/my-invitation.component';
import { VirtualScrollModule } from 'ngx-virtual-scroll-plus';

const routes: Routes = [
	{ path: '', component: MyInvitationComponent }
];

export const routing = RouterModule.forChild(routes);

@NgModule({
    declarations: [
        MyInvitationComponent,
    ],
    exports: [
        MyInvitationComponent,
    ],
    imports: [        
        SharedModule,
        HttpModule,
        SortableModule,
        SwiperModule,
        AttentionDialogModule,
        LoadingModule,
        VirtualScrollModule,
        routing
    ],
    providers: [        
    ]
})

export class MyInvitationModule {
}
