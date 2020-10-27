import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';

import { FreelancerAboutComponent } from '@app-dialogs/freelancer-setup-dialog/about/freelancer-about.component';

@NgModule({
    declarations: [ FreelancerAboutComponent ],
    exports: [ FreelancerAboutComponent ],
    imports: [ CommonModule,
            FormsModule,
            ReactiveFormsModule,            
            DropDownModule,
            DateTimeModule,
            RadioGroupModule,
            SplitTextBoxModule,
            ImageImportDialogModule,
            ImageEditorModule
    ],
    entryComponents: [
        FreelancerAboutComponent
    ],
    providers: []
})
export class FreelancerAboutModule {}
