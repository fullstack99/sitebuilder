export class EventContactInfo {
	static empty() {
		return new EventContactInfo(
			false,
			false,
			false,
			ParticipantContactInfo.empty(),
			ParticipantContactInfo.empty(),
			ParticipantContactInfo.empty()
		);
	}

	constructor(
		public collectContactInfo: boolean,
		public addWhoseComing: boolean,
		public collectGroupMembersAndLeader: boolean,
		public participantContactInfo: ParticipantContactInfo,
		public groupMemberContactInfo: ParticipantContactInfo,
		public groupLeaderContactInfo: ParticipantContactInfo
	) { }
}

export class ParticipantContactInfo {
	static empty() {
		return new ParticipantContactInfo(
			[   new ContactInfoField('Name', true, true),
				new ContactInfoField2('Address', false, false, [new SecondaryInfoField('Address1', ''), new SecondaryInfoField('Address2', ''), new SecondaryInfoField('City', ''), new SecondaryInfoField('State', ''), new SecondaryInfoField('Postal', '')], 300, 400, 'e.con.110'),
				new ContactInfoField2('Email', true, true, [new SecondaryInfoField('Email', ''), new SecondaryInfoField('Confirm Email', '')], 300, 200, 'e.con.120'),
				new ContactInfoField2('Phone', false, false, [new SecondaryInfoField('Phone', ''), new SecondaryInfoField('Mobile', '')], 300, 200, 'e.con.130')
			],
			[
				new ContactInfoField('Company - Org.', false, false),
				new ContactInfoField('Job Title', false, false),
				new ContactInfoField('Date of Birth', false, false),
				new ContactInfoField('Gender', false, false)
			],

			[
				new ContactInfoField('', false, false)
			]
		);
	}

	constructor(
		public hasDefaultFields: any,
		public defaultFields: ContactInfoField[],
		public customFields: ContactInfoField[]
	) { }
}

export class ContactInfoField {
	static empty() { return new ContactInfoField('', false, false); }

	constructor(
		public name: string,
		public choose: boolean,
		public required: boolean
	) { }
}

export class ContactInfoField2 {
	static empty() { return new ContactInfoField2('', false, false, [SecondaryInfoField.empty()], 300, 300, ''); }

	constructor(
		public name: string,
		public choose: boolean,
		public required: boolean,
		public secondary: SecondaryInfoField[],
		public width: number,
		public height: number,
		public tooltipCode: string
	) { }
}

export class SecondaryInfoField {
	static empty() { return new SecondaryInfoField('', ''); }

	constructor(
		public name: string,
		public value: string
	) { }
}
