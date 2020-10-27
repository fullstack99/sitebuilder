export interface ExpandableValue {
	root: string;
	children: Array<ExpandableChildValue>;
}

export interface ExpandableChildValue {
	value: string;
	children: Array<ExpandableChildValue>;
}
