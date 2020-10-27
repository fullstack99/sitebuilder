// import { Injectable } from '@angular/core';
// import { ExpandableChild } from '@app-directives/expandable/expandable-child';
// import { arraysEqual } from '@app-common/lib/array/array';
// import { Option, Detail } from '@app-models/ecommerce';

// @Injectable()
// export class OptionCombinationsSorter {
// 	public getSortedCombinatons(options: ExpandableChild[][], sortKey: SortKey | undefined): Option[][] {
// 		const unsortedCombinations = this.getUnsortedCombinations(options);
// 		if (!sortKey) {
// 			return unsortedCombinations;
// 		}
// 		const indexesToDisplayFirst = this.getIndexesToDisplayFirst(options, unsortedCombinations, sortKey);
// 		const sortedCombinations = this.getSortedCombinations(unsortedCombinations, indexesToDisplayFirst);
// 		return sortedCombinations;
// 	}

// 	private getUnsortedCombinations(options: ExpandableChild[][]): Option[][] {
// 		const unsortedCombinations = new Array<Array<Option>>();
// 		options[2].forEach((d2: Detail) => {
// 			options[1].forEach((d1: Detail) => {
// 				options[0].forEach((d0: Detail) => {
// 					unsortedCombinations.push(
// 						[{ detail: d0.value }, { detail: d1.value }, { detail: d2.value }]
// 					);
// 				});
// 			});
// 		});

// 		return unsortedCombinations;
// 	}

// 	private getIndexesToDisplayFirst( options: ExpandableChild[][], combinations: Option[][], sortKey: SortKey ): number[] {
// 		const details = options[sortKey.optionIndex].map(d => d.value);
// 		const firstDetail = details[sortKey.detailIndex];
// 		const sortedDetails = [firstDetail, ...details.filter(d => d !== firstDetail)];
// 		const result = sortedDetails.reduce(( accumulator: number[], current: string) => {
// 				const detailIndexes = this.getDetailIndexes(combinations, sortKey, current);
// 				return detailIndexes.concat(accumulator);
// 			}, new Array<number>());
// 		return result;
// 	}

// 	private getDetailIndexes(combinations: Option[][], sortKey: SortKey, detailValue: string): number[] {
// 		return combinations.reduce(	this.getDetailIndexesAccumulator(sortKey, detailValue), new Array<number>() );
// 	}

// 	private getDetailIndexesAccumulator(sortKey: SortKey, detailValue: string) {
// 		return (accumulator: number[], options: Option[], index: number) => {
// 			if (options[sortKey.optionIndex].detail === detailValue) {
// 				accumulator.unshift(index);
// 			}
// 			return accumulator;
// 		};
// 	}

// 	private getSortedCombinations(
// 		combinations: Option[][], indexesToDisplayFirst: number[]): Option[][] {
// 		const sortedCombinations = new Array<Array<Option>>();
// 		indexesToDisplayFirst.forEach(index => {
// 			const combination = combinations[index];
// 			sortedCombinations.unshift(combination);
// 		});

// 		const combinationsLeft = combinations.filter((unsortedCombination: Option[]) => {
// 			return !sortedCombinations.some((sortedCombination: Option[]) => {
// 				return arraysEqual<Option>(sortedCombination, unsortedCombination);
// 			});
// 		});
// 		combinationsLeft.forEach((c: Option[]) => sortedCombinations.push(c));

// 		return sortedCombinations;
// 	}
// }
