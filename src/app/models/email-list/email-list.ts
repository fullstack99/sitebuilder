export interface Contact {
    id?: number,
    uid?: string,
    email: string,
    firstName?: string,
    lastName?: string,
    company?: string,
    address1?: string,
    address2?: string,
    city?: string,
    provinceId?: number,
    countryId?: number,
    postalCode?: string,
    createDate?: string
}

export interface List {
    uid?: string,
    description: string,
    totalContact?: number
}

export interface InList {
    contacts: Array<string>,
    listUid: string
}
