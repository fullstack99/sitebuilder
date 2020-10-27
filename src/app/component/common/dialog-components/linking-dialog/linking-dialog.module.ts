import { NgModule } from '@angular/core';
import { FileDropModule } from 'ngx-file-drop';
import { SharedModule } from '@app/shared/shared.module';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { SitemapModule } from '@app-common/sitemap/sitemap.module';
import { PickItemDialogModule } from '@app-dialogs/linking-dialog/pick-item-dialog.module';
import { ButtonItemModule } from '@app-items/button/button-item.module';
import { ShapeItemModule } from '@app-items/shape/shape-item.module';
import { GoogleMapsDialogModule } from '@app-dialogs/google-maps-dialog/google-maps-dialog.module';
import { EcommNavigationDialogModule } from '@app-dialogs/ecomm-navigation-dialog/ecomm-navigation-dialog.module';

import { LinkingDialogComponent } from '@app-dialogs/linking-dialog/linking-dialog.component';

export { LinkingDialogComponent } from '@app-dialogs/linking-dialog/linking-dialog.component';

@NgModule({
    declarations   : [LinkingDialogComponent],
    exports        : [LinkingDialogComponent],
    imports        : [
            SharedModule,
            FileDropModule,
            PickItemDialogModule,            
            FeedbackDialogModule,
            ButtonItemModule,
            ShapeItemModule,
            GoogleMapsDialogModule,
            SitemapModule,
            EcommNavigationDialogModule
        ],
    entryComponents: [LinkingDialogComponent],
    providers      : []
})
export class LinkingDialogModule {}
