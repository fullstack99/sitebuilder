import { ImagePath } from '@app-models/image-info';
import { UUID } from '@app-lib/uuid/uuid.service';

export class ScheduleInfo {    
    constructor(
        public companyName: string = '',
        public locationType: string = 'WeGoToCustomerLocation', // CustomerComesToUs, WeGoToCustomerLocation
        public providerType: string = 'SingleProviderHidden', // 0: SingleProviderHidden, 1: SingleProviderDisplay 2: CustomerChoice, 3: NoProviderChoice

        public scheduleType: string = 'ExactTime', // ExactTime, BlocksOfTime
        public scheduleTimes: number = 30,

        public locations: LocationInfo[] = null,
        public services:  ServiceInfo[] = null,
        public providers: ProviderInfo[] = null,
        
        public hoursOfOperation: HourInfo = new HourInfo,        
        public uid: string = UUID.UUID(),
        public isNew: boolean = true
    ) {}
}

export class LocationInfo {
    constructor(        
        public address1: string = '',
        public address2: string = '',
        public city: string = '',
        public province: string = '',
        public postalCode: string = '',
        public phone: string = '',
        public email: string = '',
        public hoursOfOperation: HourInfo = new HourInfo,
        public uid: string = UUID.UUID(),
        public id: number = 0,
        public editStatus: string = 'NoChange',
        public willHoursChange: boolean = false, // true: it will have to be changed, false: it was already changed
    ) {}
}
export class ServiceInfo {
    constructor(        
        public title: string = '',
        public description: string = '',
        public keywords: string[] = [],
        public duration: number = 0, // 0: No, exist: Yes
        public customerLimit: number = 0, // 0: No, more than 0 : Yes
        public showService: number = 1,   // 0: Hide, 1: Now, 2: schedule
        public activeDate: Date = new Date,
        public price: number = 0,
        public itemCode: string = '', // price: 0 || itemCode: '' then No, or not : Yes
        public locations: string[] = [], // [] : No, or not : Yes        
        public uid: string = UUID.UUID(),
        public editStatus: string = 'NoChange'
    ) {}
}

export class ProviderInfo {
    constructor(        
        public name: string = '',
        public details: string = '',
        public locations: ProviderLocationInfo[] = [],
        public services: string[] = [],        
        public hoursOfOperation: HourInfo = new HourInfo,
        public uid: string = UUID.UUID(),
        public photo: ImagePath = null,
        public editStatus: string = 'NoChange',  // 'NoChange', 'Modified', 'New', 'Deleted'
        public dispUrl: string = null,
        public willHoursChange: boolean = false, // true: it will have to be changed, false: it was already changed
    ) {}
}

export class ProviderLocationInfo {
    constructor(        
        public locationUid: string = '',
        public hoursOfOperation: HourInfo = new HourInfo
    ) {}
}


export class HourInfo {
    constructor(
        public editStatus: string = 'NoChange',
        public id: number = 0,
        public times: ServiceDayInfo = new ServiceDayInfo        
    ) {}
}


export class ServiceDayInfo {
    constructor(
        public sunday: ServiceTimeInfo[] = [],
        public monday: ServiceTimeInfo[] = [ new ServiceTimeInfo ],
        public tuesday: ServiceTimeInfo[] = [ new ServiceTimeInfo ],
        public wednesday: ServiceTimeInfo[] = [ new ServiceTimeInfo ],
        public thursday: ServiceTimeInfo[] = [ new ServiceTimeInfo ],
        public friday: ServiceTimeInfo[] = [ new ServiceTimeInfo ],
        public saturday: ServiceTimeInfo[] = [ new ServiceTimeInfo ]
    ) {}
}

export class ServiceTimeInfo {
    constructor(
        public startTime: string = '08:00:00',
        public endTime: string = '19:00:00'
    ) {}
}

export class AppointmentInfo {
    constructor(
        public providerUid: string = '',
        public serviceUid: string = '',        
        public locationUid: string = '',        
        public startTime: Date = new Date,
        public endTime: Date = new Date,
        public status: number = 1, // 1: Booked, 2: Open, 3: Blocked, 4: No Show, 5: Canceled
        public name: string = '',
        public email: string = '',
        public phone: string = '',
        public notes: string = '',
        public uid: string = ''        
    ) {}
}
