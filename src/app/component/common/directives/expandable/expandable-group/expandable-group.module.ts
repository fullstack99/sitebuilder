import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { DraggableListInlineModule } from '@app-directives/draggable-list-inline/draggable-list-inline.module';
import { DraggableListModule } from '@app-directives/draggable-list/draggable-list.module';
import { ExpandableGroupComponent } from '@app-directives/expandable/expandable-group/expandable-group.component';

@NgModule({
	declarations: [
		ExpandableGroupComponent
	],
	exports: [
		ExpandableGroupComponent
	],
	imports: [
		SharedModule, 
		DraggableListModule, 
		DraggableListInlineModule		
	],
	providers: []
})
export class ExpandableGroupModule {}
