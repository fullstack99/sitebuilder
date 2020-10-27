import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, RequestOptions, JsonpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

import { GridModule } from '@progress/kendo-angular-grid';

import { ArrowButtonModule } from '@app-ui/arrow-button/arrow-button.module';
import { CheckboxModule } from '@app-ui/checkbox/checkbox.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';
import { DateTimeModule } from '@app-ui/datetime/datetime.module';
import { LoadingModule } from '@app-ui/loading/loading.module';
import { TextEditorTinyMceModule } from '@app-directives/text-editor-tinymce/text-editor-tinymce.module';
import { ContactDetailsModule } from '@app-common/email-list/contact-details/contact-details.module';
import { AddContactModule } from '@app-common/email-list/add-contact/add-contact.module';
import { AddListModule } from '@app-dialogs/add-list/add-list.module';

import { MergeListModule, MergeListComponent } from '@app-common/email-list/merge-list/merge-list.module';
import { EmailListComponent } from '@app-common/email-list/email-list.component';

@NgModule({
    declarations: [
        EmailListComponent
    ],
    exports: [
        EmailListComponent
    ],
    imports: [        
        CommonModule,
        ReactiveFormsModule,        
        HttpModule,
        HttpClientModule,
        GridModule,
        JsonpModule,        
        AddContactModule,
        ArrowButtonModule,
        CheckboxModule,
        DropDownModule,
        LoadingModule,
        AddListModule,
        MergeListModule,
        ContactDetailsModule,
        TextEditorTinyMceModule,
        DateTimeModule
        // SampleModule
    ],
    providers: []
})
export class EmailListModule { }
