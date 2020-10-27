import { createSelector } from 'reselect';
import { combineReducers } from '@ngrx/store';

const itemsByIdState = (state: any) => state.items.items;
const optionCombinationsByIdState = (state: any) => state.items.optionCombinations;

const initialState: any = {
	ids: [],
	items: {},
	optionCombinations: {}
}

interface State {
	ids: number[],
	items: any,
	optionCombinations: any
}

export const items = (state: State = initialState, action: any): State => {
	switch (action.type) {
		case 'LOAD_ITEMS':
			return {
				...action.payload
			}
		case 'UPDATE_ITEM':
			return {
				...state,
				items: itemsById(state.items, action)
			}
		case 'UPDATE_OPTION_COMBINATION':
			return {
				...state,
				optionCombinations: optionCombinations(state.optionCombinations, action)
			}
		default:
			return state;
	}
}

const itemsById = (state: any = {}, action: any) => {
	switch (action.type) {
		case 'UPDATE_ITEM':
			return {
				...state,
				[action.payload.id]: action.payload
			}
		default:
			return state;
  }
}

const item = (state: any = {}, action: any) => {
	switch (action.type) {
		default:
		return state;
	}
}

const optionCombinations = (state: any = {}, action: any) => {
	switch (action.type) {
		case 'UPDATE_OPTION_COMBINATION':
			return {
				...state,
				[action.payload.id]: action.payload
			}
		default:
			return state;
	}
}

const getItemIds = (state: any) => {
  	return state.items.ids;
}

const itemsSelector = createSelector(getItemIds, itemsByIdState, (ids, entities) => {
  	return ids.map((i: number) => entities[i]);
});

export const itemsWithOptionCombinationsSelector = createSelector(
	itemsSelector, optionCombinationsByIdState, (items, optionCombinationEntities) => {
		return items.map((item: any) => {
			return {
				...item,
				inventory: calculateTotalForProperty(item, optionCombinationEntities, 'inventory'),
				onOrder: calculateTotalForProperty(item, optionCombinationEntities, 'onOrder')
			}
		})
	}
)

export const getOptionCombinationsFor = (item: any) => {
	return createSelector(
		optionCombinationsByIdState, (optionCombinationEntities) => {
		return item.optionCombinations.map((id: number) => {
			return optionCombinationEntities[id];
		});
		}
	)
}

const calculateTotalForProperty = (item: any, optionCombinationEntities: any[], property: string) => {
	if (item.optionCombinations.length === 0) {
		return item[property];
	}
	return item.optionCombinations.reduce((accumulator: number, current: number) => {
		const optionCombination = optionCombinationEntities[current];
		return accumulator + optionCombination[property];
	}, 0)
}

