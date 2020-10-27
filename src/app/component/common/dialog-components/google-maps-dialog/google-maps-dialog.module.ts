import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';

import { GoogleMapsDialogComponent } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyC-2R30SfR48K7KOli2ld8WbQ8qV3mfwgg',
            libraries: ["places"]
        })
    ],
    declarations: [
        GoogleMapsDialogComponent,
    ],
    exports: [
        GoogleMapsDialogComponent
    ],
    entryComponents: [ GoogleMapsDialogComponent ],
    providers: []
})

export class GoogleMapsDialogModule {
}