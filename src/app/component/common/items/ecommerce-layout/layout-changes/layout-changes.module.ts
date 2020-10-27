import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LayoutChangesComponent } from '@app-items/ecommerce-layout/layout-changes/layout-changes.component';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { DropDownModule } from '@app-ui/drop-down-menu/drop-down.module';

export { LayoutChangesComponent } from '@app-items/ecommerce-layout/layout-changes/layout-changes.component';

@NgModule({
    declarations   : [LayoutChangesComponent],
    exports        : [LayoutChangesComponent],
    imports        : [CommonModule, ReactiveFormsModule, FeedbackDialogModule, DropDownModule, RadioGroupModule],
    entryComponents: [LayoutChangesComponent],
    providers      : []
})
export class LayoutChangesModule {}
