import { NgModule } from '@angular/core';
import { SharedModule } from '@app-shared/shared.module';
import { ReplyComponent } from '@app/component/invitation/reply/reply.component';

@NgModule({
    imports: [
        SharedModule        
    ],
    declarations: [
        ReplyComponent
    ],
    exports: [
        ReplyComponent
    ],
    providers: [        
    ]
})

export class ReplyModule {

}