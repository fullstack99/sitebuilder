export class Detail {
    public value: string;
}
export class DetailCombination {    
    constructor(public details: Array<Detail>) {
    }

    public get empty(): boolean {
        return this.details.every(( d: Detail ) => d.value === '');
    }
}