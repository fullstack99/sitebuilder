import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({
	name: 'vimeoSafeUrl'
})
export class VimeoSafeUrlPipe implements PipeTransform {

	constructor(public sanitizer: DomSanitizer) {
	}

	transform(uri: string, autoplay: number): SafeResourceUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl(	
			`https://player.vimeo.com/video/${uri.substr(8)}`);
	}
	//http://player.vimeo.com/video/78675881
}
