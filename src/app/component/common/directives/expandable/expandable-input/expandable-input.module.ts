import { NgModule } from '@angular/core';
import { ExpandableModule } from '@app-directives/expandable/expandable.module';
import { ExpandableInputComponent } from '@app-directives/expandable/expandable-input/expandable-input.component';
import { SplitTextBoxModule } from '@app-ui/split-text-box/split-text-box.module';
import { ClearableInputModule } from '@app-ui/clearable-input/clearable-input.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
@NgModule({
	declarations: [
		ExpandableInputComponent
	],
	exports: [
		ExpandableInputComponent
	],
	imports: [
		ExpandableModule,
		SplitTextBoxModule,
		ClearableInputModule,
		DraggableListModule
	],
	providers: []
})
export class ExpandableInputModule {}
