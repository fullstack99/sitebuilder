import * as lodash from 'lodash';
import { ImagePath } from '@app-models/image-info';

export class BackgroundInfo {
	constructor(
		public backgroundColor?: BackgroundColorInfo,
		public backgroundImage?: BackgroundImageInfo,
		public backgroundTiling?: BackgroundTilingInfo,
		public backgroundVideo?: BackgroundVideoInfo
	) { }
	static empty(): BackgroundInfo {
		return new BackgroundInfo();
	}
}

export class BackgroundColorInfo {
	constructor(
		public startColor: string,
		public endColor: string,
		public horizontal: number,
		public vertical: number
	) { }
	static empty(): BackgroundColorInfo {
		return new BackgroundColorInfo('transparent', '#ffffff', 0, 0);
	}
}

export class BackgroundImageInfo {
	constructor(
		public imageOpacity: number,
		public imageScrolling: string, // move, freeze, parallax
		public imagePosition: string,
		public imageBehindColor: string,
		public image: ImagePath,
		public multiImages: ImagePath[]
	) { }
	static empty(): BackgroundImageInfo {
		return new BackgroundImageInfo(100, 'move', 'top center', '', null, []);
	}
}

export class BackgroundTilingInfo {
	constructor(
		public tilingOpacity: number,
		public tilingBehindColor: string,
		public image: ImagePath
	) { }
	static empty(): BackgroundTilingInfo {
		return new BackgroundTilingInfo(100, '', null);
	}
}

export class BackgroundVideoInfo {
	constructor(
	) { }
	static empty(): BackgroundVideoInfo {
		return new BackgroundVideoInfo();
	}
}
