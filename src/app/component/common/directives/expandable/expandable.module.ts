import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AttentionDialogModule } from '@app-dialogs/attention-dialog/attention-dialog.module';
import { RootTemplateDirective } from '@app-directives/expandable/root-template.directive';

@NgModule({
  declarations: [RootTemplateDirective],
  exports: [CommonModule, FormsModule, ReactiveFormsModule],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AttentionDialogModule],
  providers: []
})
export class ExpandableModule {}
