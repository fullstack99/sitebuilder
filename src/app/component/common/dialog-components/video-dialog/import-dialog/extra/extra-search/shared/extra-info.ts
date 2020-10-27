export class YouTubeInfo {

	constructor(
		public videoId: string,
		public title: string,
		public thumbnailUrl: string,
		public channelTitle: string,
		public channelId: string,
		public publishedAt: string,
		public description: string) {
			this.videoId = videoId;
			this.title = title;
			this.thumbnailUrl = thumbnailUrl;
			this.channelTitle = channelTitle;
			this.channelId = channelId;
			this.publishedAt = publishedAt;
			this.description = description;
	};
}

export class VimeoInfo {

	constructor(
		public uri: string,
		public name: string,
		public link: string,
		public thumbnailUrl: string,
		public duration: string,
		public modified_time: string,
		public embed: string,
		public description: string) {
			this.uri = uri;
			this.name = name;
			this.link = link;
			this.thumbnailUrl = thumbnailUrl;
			this.duration = duration;
			this.modified_time = modified_time;
			this.embed = embed;
			this.description = description;
	};
}
