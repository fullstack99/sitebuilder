import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { EcommerceLayoutComponent } from '@app-items/ecommerce-layout/ecommerce-layout.component';
import { WindowService } from '@app-common/window/window.service';

@NgModule({
    declarations   : [EcommerceLayoutComponent],
    exports        : [EcommerceLayoutComponent],
    imports        : [CommonModule, ReactiveFormsModule, FeedbackDialogModule, SwiperModule],
    entryComponents: [EcommerceLayoutComponent],
    providers      : [WindowService]
})
export class EcommerceLayoutModule {}
