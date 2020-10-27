import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createTermsPolicyDialogWindow (
  windowService: WindowService,
  whichPolicy: string = 'terms'
): DialogWindow<TermsPolicyComponent> {
  return windowService
	.create<TermsPolicyComponent>(TermsPolicyComponent, {
	  width: '100%',
	  maxWidth: 500,
	  height: 600,
	  modal: true,
	  draggable: false,
	  resizable: true,
	  scrollable: false,
	  visible: false,
	  title: false
	})
	.changeInputs((comp, window) => {
	  comp.whichPolicy = whichPolicy;
	  comp.close.subscribe(() => window.close());
	});
}

@Component({
  selector: 'app-terms-policy',
  templateUrl: './terms-policy.component.html',
  styleUrls: ['./terms-policy.component.css']
})
export class TermsPolicyComponent implements OnInit {
	@Input() whichPolicy: string = 'terms';
	@Output() close = new EventEmitter<string>();

  	terms: any = [];

	termsPolicy = [
		{
			title: 'Communications',
			content: ['By creating an Account on our service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.']
		},
		{
			title: 'Subscriptions',
			content: [
				'Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly basis.',
				'At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or GloGood Inc. cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting GloGood Inc. customer support team.',
				'A valid payment method, including credit card or PayPal, is required to process the payment for your Subscription. You shall provide GloGood Inc. with accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize GloGood Inc. to charge all Subscription fees incurred through your account to any such payment instruments.',
				'Should automatic billing fail to occur for any reason, GloGood Inc. will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.',
			]
		},
		{
			title: 'Free Trial',
			content: [
				'GloGood Inc. may, at its sole discretion, offer a Subscription with a free trial for a limited period of time ("Free Trial").',
				'You may be required to enter your billing information in order to sign up for the Free Trial.',
				'If you do enter your billing information when signing up for the Free Trial, you will not be charged by GloGood Inc. until the Free Trial has expired. On the last day of the Free Trial period, unless you cancelled your Subscription, you will be automatically charged the applicable Subscription fees for the type of Subscription you have selected.',
				'At any time and without notice, GloGood Inc. reserves the right to (i) modify the terms and conditions of the Free Trial offer, or (ii) cancel such Free Trial offer.'
			]
		},
		{
		title: 'Free Changes',
		content: [
			'GloGood Inc., in its sole discretion and at any time, may modify the Subscription fees for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.',
			'GloGood Inc. will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.',
			'Your continued use of the Service after the Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.',
		]
		},
		{
			title: 'Refunds',
			content: [
				'Except when required by law, paid Subscription fees are non-refundable.'
			]
		},
		{
			title: 'Content',
			content: [
				'Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.',
				'By posting Content on or through the Service, You represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity. We reserve the right to terminate the account of anyone found to be infringing on a copyright.',
				'You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third party posts on or through the Service. However, by posting Content using the Service you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You agree that this license includes the right for us to make your Content available to other users of the Service, who may also use your Content subject to these Terms.',
				'GloGood Inc. has the right but not the obligation to monitor and edit all Content provided by users.',
				'In addition, Content found on or through this Service are the property of GloGood Inc. or used with permission. You may not distribute, modify, transmit, reuse, download, repost, copy, or use said Content, whether in whole or in part, for commercial purposes or for personal gain, without express advance written permission from us.'
			]
		},
		{
			title: 'Account',
			content: [
				'When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.',
				'You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password, whether your password is with our Service or a third-party service. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.',
				'You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar or obscene.'
			]
		},
		{
			title: 'Intellectual Property',
			content: [
				'The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of GloGood Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of GloGood Inc.',
			]
		},
		{
			title: 'Links To Other Web Sites',
			content: [
				'Our Service may contain links to third party web sites or services that are not owned or controlled by GloGood Inc.',
				'GloGood Inc. has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.',
				'You acknowledge and agree that GloGood Inc. shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such third party web sites or services.',
				'We strongly advise you to read the terms and conditions and privacy policies of any third party web sites or services that you visit.'
			]
		},
		{
			title: 'Termination',
			content: [
				'We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.',
				'If you wish to terminate your account, you may simply discontinue using the Service',
				'All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.'
			]
		},
		{
			title: 'Indemnification',
			content: [
				'You agree to defend, indemnify and hold harmless GloGood Inc. and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney&#39;s fees), resulting from or arising out of a) your use and access of the Service, by you or any person using your account and password; b) a breach of these Terms, or c) Content posted on the Service.'
			]
		},
		{
			title: 'Limitation Of Liability',
			content: [
				'In no event shall GloGood Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.',
			]
		},
		{
			title: 'Disclaimer',
			content: [
				'Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.'
			]
		},
		{
			title: 'Disclaimer',
			content: [
				'Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.',
				'GloGood Inc. its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.'
			]
		},
		{
			title: 'Exclusions',
			content: [
				'Some jurisdictions do not allow the exclusion of certain warranties or the exclusion or limitation of liability for consequential or incidental damages, so the limitations above may not apply to you.'
			]
		},
		{
			title: 'Governing Law',
			content: [
				'These Terms shall be governed and construed in accordance with the laws of Massachusetts, United States, without regard to its conflict of law provisions.',
				'Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have had between us regarding the Service.'
			]
		},
		{
			title: 'Changes',
			content: [
				'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.',
				'By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.'
			]
		},
		{
			title: 'Contact Us',
			content: [
				'If you have any questions about these Terms, please contact us.',
				'By email: terms@glogood.com'
			]
		}
	];

	privacyPolicy = [
		{
			title: 'Definitions',
			content: [
				'Service',
				'Service is the glogood.com website operated by GloGood Inc.',

				'Personal data',
				'Personal Data means data about a living individual who can be identified from those data (or from those and other information either in our possession or likely to come into our possession).',

				'Usage Data',
				'Usage Data is data collected automatically either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).',

				'Cookies',
				'Cookies are small files stored on your device (computer or mobile device).',

				'Data Controller',
				'Data Controller means the natural or legal person who (either alone or jointly or in common with other persons) determines the purposes for which and the manner in which any personal information are, or are to be, processed.',
				'For the purpose of this Privacy Policy, we are a Data Controller of your Personal Data.',

				'Data Processors (or Service Providers)',
				'Data Processor (or Service Provider) means any natural or legal person who processes the data on behalf of the Data Controller.',
				'We may use the services of various Service Providers in order to process your data more effectively.',

				'Data Subject (or User)',
				'Data Subject is any living individual who is using our Service and is the subject of Personal Data.'
			]
		},
		{
			title: 'Information Collection and Use',
			content: [
				'We collect several different types of information for various purposes to provide and improve our Service to you.',

				'Types of Data Collected',
				'Personal Data',
				'While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally, identifiable information may include, but is not limited to:',

				'Email address',
				'First name and last name',
				'Phone number',
				'Address, State, Province, ZIP/Postal code, City',
				'Cookies and Usage Data',

				'We may use your Personal Data to contact you with newsletters, marketing or promotional materials and other information that may be of interest to you. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or the instructions provided in any email we send.',

				'Usage Data',
				'We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer&#39;s Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.',

				'Tracking & Cookies Data',
				'We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information.',
				'Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Other tracking technologies are also used such as beacons, tags and scripts to collect and track information and to improve and analyze our Service.',
				'You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.',
				'Examples of Cookies we use:',
				'Session Cookies. We use Session Cookies to operate our Service.',
				'Preference Cookies. We use Preference Cookies to remember your preferences and various settings.',
				'Security Cookies. We use Security Cookies for security purposes.',
			]
		},
		{
			title: 'Use of Data',
			content: [
				'GloGood Inc. uses the collected data for various purposes:',
				'To provide and maintain our Service',
				'To notify you about changes to our Service',
				'To allow you to participate in interactive features of our Service when you choose to do so',
				'To provide customer support',
				'To gather analysis or valuable information so that we can improve our Service',
				'To monitor the usage of our Service',
				'To detect, prevent and address technical issues',
				'To provide you with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless you have opted not to receive such information'
			]
		},
		{
			title: 'Legal Basis for Processing Personal Data under the General Data Protection Regulation (GDPR)',
			content: [
				'If you are from the European Economic Area (EEA), GloGood Inc. legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data we collect and the specific context in which we collect it.',
				'GloGood Inc. may process your Personal Data because:',
				'We need to perform a contract with you',
				'You have given us permission to do so',
				'The processing is in our legitimate interests and it is not overridden by your rights',
				'For payment processing purposes',
				'To comply with the law'
			]
		}
	];

	constructor(
		private elementRef: ElementRef
	) {}

	ngOnInit() {
		if (this.whichPolicy == 'terms')
			this.terms = this.termsPolicy;
		else if (this.whichPolicy == 'privacy')
			this.terms = this.privacyPolicy;
		else
			(this.elementRef.nativeElement as HTMLElement).parentElement.style.height = '380px';
	}

	onContainerClick(event: MouseEvent) {

	}

	openFeedbackDialog(event: MouseEvent) {

	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

}
