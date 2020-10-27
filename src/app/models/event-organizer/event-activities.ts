export type EventActivities = SimpleEvent | EventWithActivitiesSingleFee
						| EventWithActivitiesMultiFee | EventWithParticipantTypes;

export class SimpleEvent {
	eventType: 'SimpleEvent' = 'SimpleEvent';
	static empty() {
		return new SimpleEvent(EventAdmission.empty());
	}
	constructor(
		public admission: EventAdmission
	) {}
}

export class EventWithActivitiesSingleFee {
	eventType: 'EventWithActivitiesSingleFee' = 'EventWithActivitiesSingleFee';
	static empty() {
		return new EventWithActivitiesSingleFee(
			EventAdmission.empty(), [EventActivity.empty()]
		);
	}
	constructor(
		public admission: EventAdmission,
		public activities: EventActivity[]
	) {}
}

export class EventWithActivitiesMultiFee {
	eventType: 'EventWithActivitiesMultiFee' = 'EventWithActivitiesMultiFee';
	static empty() {
		return new EventWithActivitiesMultiFee([EventActivityWithFee.empty()]);
	}
	constructor(
		public activities: EventActivityWithFee[]
	) {}
}

export class EventWithParticipantTypes {
	eventType: 'EventWithParticipantTypes' = 'EventWithParticipantTypes';
	static empty() {
		return new EventWithParticipantTypes([EventParticipantType.empty()]);
	}
	constructor (
		public participantTypes: EventParticipantType[]
	) {}
}

export class EventActivity {
	static empty() {
		return new EventActivity('', EventMessage.empty(), new Date, new Date, undefined, 0);
	}
	constructor(
		public name: string,
		public message: EventMessage,
		public startDate: Date,
		public endDate: Date,
		public participantsLimit: number | undefined,
		public guests: number
	) {}
}

export class EventActivityWithFee {
	static empty() {
		return new EventActivityWithFee(
			'', EventMessage.empty(), new Date, new Date, RegularEventFee.empty(), undefined, 0);
	}
	constructor(
		public name: string,
		public message: EventMessage,
		public startDate: Date,
		public endDate: Date,
		public fee: EventFee,
		public participantsLimit: number | undefined,
		public guests: number
	) {}
}

export class EventParticipantType {
	static empty() {
		return new EventParticipantType('', EventAdmission.empty());
	}
	constructor(
		public name: string,
		public admission: EventAdmission
	) {}
}

export class EventAdmission {
	static empty() {
		return new EventAdmission(EventMessage.empty(), RegularEventFee.empty(), undefined, 0);
	}
	constructor(
		public message: EventMessage,
		public fee: any,
		public participantsLimit: number | undefined,
		public guests: number
	) {}
}

export class EventMessage {
	static empty() {
		return new EventMessage('', '');
	}
	constructor(
		public participantsMessage: string,
		public groupsMessage: string
	) {}
}

export type EventFee = EarlyBirdEventFee | RegularEventFee;
export type EventFeeType = 'RegularEventFee' | 'EarlyBirdEventFee';

export class RegularEventFee {
	eventFeeType: 'RegularEventFee' = 'RegularEventFee';
	static empty() {
		return new RegularEventFee(undefined);
	}
	constructor(
		public price: number | undefined
	) {}
}

export class EarlyBirdEventFee {
	eventFeeType: 'EarlyBirdEventFee' = 'EarlyBirdEventFee';
	static empty() {
		return new EarlyBirdEventFee(undefined, undefined, undefined);
	}
	constructor(
		public price: number | undefined,
		public earlyPrice: number | undefined,
		public earlyPriceEndDate: Date | undefined
	) { }
}
