import { Pipe, PipeTransform } from "@angular/core";

const PADDING = "000000";

@Pipe({ name: "currency" })
export class CurrencyPipe implements PipeTransform {

    private DECIMAL_SEPARATOR: string;
    private THOUSANDS_SEPARATOR: string;

    constructor() {      
        this.DECIMAL_SEPARATOR = ".";
        this.THOUSANDS_SEPARATOR = "'";
    }

    transform(value: number | string, fractionSize: number = 2): string {
        let [integer, fraction = ""] = (value || "").toString().split(this.DECIMAL_SEPARATOR);
        fraction = fraction.replace(/0+$/g, '');
        if (fraction)
            fraction = "." + fraction;
        integer = Number(integer) > 0 ? parseInt(integer, 10).toString() : '0';        
        return (parseInt(integer + fraction, 10) > 0 || Number(integer + fraction) > 0) ? integer + fraction : '';
    }

  parse(value: string, fractionSize: number = 2): string {
        let [ integer, fraction = "" ] = (value || "").split(this.DECIMAL_SEPARATOR);
        integer = integer.replace(new RegExp(this.THOUSANDS_SEPARATOR, "g"), "");
        integer = Number(integer) > 0 ? integer : '0';
        fraction = fraction.replace(/0+$/g, '');
        if (fraction)
            fraction = "." + fraction;
        return Number(integer + fraction) > 0 ? integer + fraction : '';
  }
}