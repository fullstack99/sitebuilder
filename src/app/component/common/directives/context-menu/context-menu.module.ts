import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogModule } from '@app-dialogs/feedback-dialog/feedback-dialog.module';
import { ContextMenuDirective } from '@app-directives/context-menu/context-menu.directive';
import { MenuComponent } from '@app-directives/context-menu/menu.component';

@NgModule({
    declarations   : [ContextMenuDirective, MenuComponent],
    exports        : [ContextMenuDirective],
	imports		   : [CommonModule, ReactiveFormsModule, FeedbackDialogModule],
    entryComponents: [MenuComponent],
    providers      : []
})
export class ContextMenuModule {}
