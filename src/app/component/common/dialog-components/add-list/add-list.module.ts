import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AddListComponent } from '@app-dialogs/add-list/add-list.component';

export { AddListComponent } from '@app-dialogs/add-list/add-list.component';

@NgModule({
    declarations   : [AddListComponent],
    exports        : [AddListComponent],
    imports        : [CommonModule, ReactiveFormsModule],
    entryComponents: [AddListComponent],
    providers      : []
})
export class AddListModule {}
