import { ImagePath } from '../image-info';
import { EventContactInfo } from './event-contact-info';
import { EventActivities, SimpleEvent } from './event-activities';
import { Item } from '../item-info';
export class EventSetupInfo {
	static empty(): EventSetupInfo {
		return new EventSetupInfo(
			'', '', null, new Date(), new Date(), '', '', '', '', '', '', '', true, true,
			EventContactInfo.empty(),
			SimpleEvent.empty(),
			null,
		);
	}

	constructor (
		public title: string,
		public description: string,
		public image: ImagePath,
		public startDate: Date,
		public endDate: Date,
		public address1: string,
		public address2: string,
		public city: string,
		public state: string,
		public postalCode: string,
		public contact: string,
		public email: string,
		public displayDescription: boolean,
		public displayImage: boolean,
		public eventContactInfo: EventContactInfo,
		public eventActivitiesInfo: EventActivities,
		public eventFeedback: { noThanks: false, survey: Item },
	) {}
}

export interface EventReportInfo {
	uid: string;
	name: string;
	startDate: Date;
	endDate: Date;
	eventType: string;
	participants: number;
	activities?: ActivityInfo[];
	amount?: number;
	fee?: number;
	balance?: number;
}

export interface ActivityInfo {
	uid: string;
	name: string;
	participants: number;
	amount: number;
}

export interface ParticipantInfo {
	uid: string;
	email: string;
	firstName: string;
	lastName: string;
	activity: number;
}
