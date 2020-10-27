import { ImagePath } from '../image-info';
export class EventInfo {
	static empty(): EventInfo {
		return new EventInfo(
			'', '', null, new Date(), new Date(), '', '', '', '', '', '', '', true, true,
		);
	}

	constructor(
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
		public displayImage: boolean
	) {}
}
