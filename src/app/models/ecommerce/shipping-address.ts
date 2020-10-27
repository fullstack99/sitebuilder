export class ShippingAddress {
    constructor(
        public email: string = "",
        public confirmEmail: string = "",
        public firstName: string = "",
        public lastName: string = "",
        public address1: string = "",
        public address2: string = "",
        public city: string = "",
        public state: number = null,
        public postalCode: string = "",
        public countryId: number = null,
        public phone: string = ""
    ) {}
}
