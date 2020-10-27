import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { ImageImportDialogModule } from '@app-dialogs/image-import-dialog/image-import-dialog.module';
import { ImageEditorModule } from '@app-dialogs/image-editor/image-editor.module';

import { ProvidersComponent } from '@app-dialogs/scheduler-setup-dialog/providers/providers.component';

@NgModule({
    declarations: [ ProvidersComponent ],
    exports: [ ProvidersComponent ],
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
        ProvidersComponent
    ],
    providers: []
})
export class ProvidersModule {}
