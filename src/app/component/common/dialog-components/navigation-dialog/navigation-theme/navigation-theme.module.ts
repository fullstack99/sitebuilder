import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RadioGroupModule } from '@app-ui/radio-group/radio-group.module';
import { SortableModule } from '@progress/kendo-angular-sortable';

import { LoadingModule } from '@app-ui/loading/loading.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';

import { NavigationThemeComponent } from '@app-dialogs/navigation-dialog/navigation-theme/navigation-theme.component';

@NgModule({
	declarations: [NavigationThemeComponent],
	exports: [NavigationThemeComponent],
	imports: [
		CommonModule, ReactiveFormsModule,
		RadioGroupModule,
		DraggableListInlineModule,
    DraggableListModule,
    LoadingModule
	],
	entryComponents: [NavigationThemeComponent],
	providers: []
})
export class NavigationThemeModule { }
