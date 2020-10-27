import { Type, Component } from '@angular/core';

export interface ItemMenu {
	id: number,
	title: string,
	selected: boolean,
	componentType: Type<Component>
}
