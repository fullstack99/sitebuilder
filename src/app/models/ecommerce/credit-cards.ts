export class CreditCards {
	constructor(
        public cardName: string = '',
        public address1: string = '',
        public address2: string = '',
        public city: string = '',
        public state: number = 0,
        public postalCode: string = '',
        public cardNumber: number = 0,
        public expirationDateYear: number = 2018,
        public expirationDateMonth: string = '',
        public cvvCode: string = '',
        public asShippingAddress: boolean = true
    ) {}
}