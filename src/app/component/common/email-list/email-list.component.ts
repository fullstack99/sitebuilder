import {
	Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
	OnInit, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { saveAs, encodeBase64 } from '@progress/kendo-file-saver';
import { GridComponent, GridDataResult, PageChangeEvent } from '@progress/kendo-angular-grid';
import { SortDescriptor, orderBy } from '@progress/kendo-data-query';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
// import { } from '@types/kendo-ui';
// import { } from 'jquery';
import * as moment from 'moment';
// import {Debounce} from 'angular2-debounce';
// import { debounceTime } from 'rxjs\add\operator';
import * as debounceTime from 'rxjs/add/operator/debounceTime';

import { createUserRegisterWindow } from '@app-auth/containers/register-page/register-page.component';

import { createAddContactWindow } from '@app-common/email-list/add-contact/add-contact.component';
import { createMergeListWindow } from '@app-common/email-list/merge-list/merge-list.component';
import { createAddListWindow } from '@app-dialogs/add-list/add-list.component';
import { createContactDetailsWindow } from '@app-common/email-list/contact-details/contact-details.component';

import { DateRange } from '@app-ui/datetime-range/daterange';
import { Contact, List, InList } from '@app-models/email-list';
import { InvitationInfo } from '@app/models';
import { AlertService, EmailService } from '@app/services';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';
import { WindowService } from '@app-common/window/window.service';

@Component({	
	moduleId: module.id,
	selector: 'email-list',
	templateUrl: './email-list.component.html',
	styleUrls: ['./email-list.component.css'],
})

export class EmailListComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input() private menu: number;

	@ViewChild('input') private _input: ElementRef;
	@ViewChild('grid') private grid: GridComponent;   
		
	gridView: GridDataResult;
	sort: SortDescriptor[] = [];
	orderby: string = "";	   
	pageSize: number = 40;
	skip: number = 0;
	total: number = 0;
		
	contacts: Array<Contact> = [];
	loadList: Array<List> = [];
	selectedContactUids: Array<string> = [];

	menuSelect = new FormControl(0); // 0:details, 1:lists
	category: string = 'Master Active';
	allEmails = ['Master Active', 'Bounced', 'Unsubscribed', 'Master Contacts'];	

	emailList = new FormControl('');
	check: FormGroup = new FormGroup({});
	allCheck = new FormControl(false); // // For selecting all the rows
	dateFilter = new FormControl(false); // For showing Date Filter
	startDate = new FormControl('');
	endDate = new FormControl('');

	_from: Date = new Date('2017-01-01');
	_to: Date = new Date('2017-12-31');	

	_loading: boolean = false;
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private emailService: EmailService,
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService,
		private appService: AppService,
		private windowService: WindowService
	) {}	

	ngOnInit() {		
		this.loadLists();		
		this.subs = [			
			Rx.Observable.merge(
				this.dateFilter.valueChanges,				
			).subscribe(t => this.changeDetector.detectChanges()),

			this.menuSelect.valueChanges.subscribe(() => {				
				if (this.menuSelect.value == 0) {
					this.emailList.setValue('master');
				}
			}),

			Rx.Observable.merge(
				this.startDate.valueChanges,
				this.endDate.valueChanges
			).subscribe(() => {
				this.setGridData();
			}),

			this.emailList.valueChanges.subscribe(() => {				
				this.refresh();
				this.onSelectEmailList();
			})
		];

		this.menuSelect.setValue(this.menu);		
	}

	ngOnChanges(changes: any) {
		if (!this.viewInited) return;		
		this.menuSelect.setValue(this.menu);
	}

	ngAfterViewInit(): void {
		this.viewInited = true;
	}

	loadLists() {		
		this.loadList = [];		
		if (!this.appService._currentUser) return;		
		this.emailService.getLists().subscribe(
			res => {
				if (res)
					res.forEach(l => {				
						this.loadList.push({
							uid: l.uid,
							description: l.description,
							totalContact: l.totalContact
						});
					});
			},
			error => {},
			() => {}
		);		
	}	

	refresh() {
		this.selectedContactUids = [];
		this.contacts = [];
		this.sort = [];
		this.allCheck.setValue(false);		
		this.dateFilter.setValue(false);		
	}

	onSelectMasterView(event: string) {
		this.category = event;
	}

	pageChange(event: PageChangeEvent): void {		
		this.skip = event.skip;
		let lastPageNum = this.skip + this.pageSize;
		console.log('next page', event, lastPageNum);
		if (lastPageNum <= this.contacts.length)
			this.setGridData();
		else
			this.onSelectEmailList();
	}

	sortChange(sort: SortDescriptor[]): void {		
		this.orderby = sort[0].field == 'lastName' ? 'last_name' : sort[0].field == 'firstName' ? 'first_name' : sort[0].field;
		this.sort = sort;		
		this.setGridData();
	}
		
	setGridData() {
		let contacts = this.contacts;
		if (this.startDate.value) {			
			contacts = contacts.filter(c=> new Date(c.createDate) >= this.startDate.value);
		}
		if (this.endDate.value) {
			contacts = contacts.filter(c=> new Date(c.createDate) <= this.endDate.value);
		}

		this.gridView = {
			data: orderBy(contacts.slice(this.skip, this.skip + this.pageSize), this.sort),
			total: this.total
		};		
	}
		
	onChecked(event: any, index: number, uid: string, state: number) {
		let selectedList = this.loadList.filter(ll=>ll.description == this.emailList.value && ll.uid);

		if (index == -1 && event.srcElement['checked'] == true) {			
			if (state == 0 || selectedList.length == 0) {
				this.selectedContactUids = this.contacts.length > 0 ? this.contacts.map(c=>c.uid) : [];
				this.emailService.getContacts(0, this.total, this.orderby).subscribe(
					res => {						
					},
					error => {
					},
					() => {return;}
				);
			}
			
			else if (state == 1 && selectedList.length > 0) {
				this.selectedContactUids = this.contacts.length > 0 ? this.contacts.map(c=>c.uid) : [];
				this.emailService.getInList(selectedList[0].uid, 0, this.total, this.orderby).subscribe(
					res => {						
					},
					error => {},
					() => {return;}
				);
			}
		}
		else if (index == -1 && event.srcElement['checked'] == false) {			
			this.selectedContactUids = [];
		}
		else if (index >=0 && event.srcElement['checked'] == true) {			
			if (this.selectedContactUids.indexOf(uid) < 0)
				this.selectedContactUids.push(uid);
		}
		else {
			this.selectedContactUids = this.selectedContactUids.filter(s=>s!=uid);			
			this.allCheck.setValue(false);
		}		
	}

	onAddContact() {		
		let list = this.loadList.map(ll=>ll.description);
		let contactUids: Array<string> = [];
		let addContact = createAddContactWindow(this.windowService, list);

		addContact.componentRef.instance.submit.subscribe(res => {			
			this.emailService.insertContacts(res.info).subscribe(
				res1 => {
					if (res1) {
						this.alertService.playToast('Success', 'Contacts added.', 0, 2000);
						res1.forEach(c => {
							if (c.uid != null)
								contactUids.push(c.uid);
						});
						this.saveInLists(res.list, contactUids);
						this.onSelectEmailList(true);
					}					
				},
				error => { this.alertService.playToast('Failed', 'Contacts are not added.', 1, 2000); },
				() => {}
			);					   
			addContact.destroy();
		});

		addContact.componentRef.instance.close.subscribe(() => {			
			addContact.destroy();
		});

		if (!this.appService._currentUser) {			
			let accountRegisterDialog = createUserRegisterWindow(this.windowService, true);
			accountRegisterDialog.componentRef.instance.closeEmitter.subscribe(res=> {
				accountRegisterDialog.destroy();
				if (res) {					
					addContact.open();
				}
				else {
					this.changeDetector.detectChanges();
				}
			});
			accountRegisterDialog.open();
		}
		else {
			addContact.open();
		}
	}

	addInList() {
		if (!this.allCheck.value && this.selectedContactUids.length < 1) return;

		let newList = [];
		this.loadList.forEach((l) => {
			if (l.description != this.emailList.value)
				newList.push(l.description);
		})
		let addListWin = createAddListWindow(this.windowService, newList);			

		addListWin.componentRef.instance.submit.subscribe(s => {				
			this.saveInLists(s.list, this.selectedContactUids);
			addListWin.destroy();
		});
		addListWin.open();
	}

	removeInList() {
		if (!this.allCheck.value && this.selectedContactUids.length < 1) return;
		
		this.refreshView(true);

		let selectedList = this.loadList.filter(ll=>ll.description == this.emailList.value && ll.uid);
		let newInList: InList = {
			contacts: this.selectedContactUids,
			listUid: selectedList.length > 0 ? selectedList[0].uid : null
		};

		this.emailService.removeInList(newInList).subscribe(
			res=> {				
				if (res) {
					this.alertService.playToast('Success', 'Contacts are removed from the selected list.', 0, 2000);				
					this.total -= this.selectedContactUids.length;
					this.contacts = this.contacts.filter(c=>this.selectedContactUids.indexOf(c.uid) < 0);
					this.selectedContactUids = [];
					this.setGridData();
				}
				else {
					this.alertService.playToast('Failed', 'Contacts are not removed from the selected list.', 1, 2000);
				}
			},
			error => { this.alertService.playToast('Failed', 'Contacts are not removed from the selected list.', 1, 2000); },
			() => { this.refreshView(); }
		);
	}   

	removeList(index: number) {
		if (index > this.loadList.length -1) return;
		this.refreshView(true);
		if (this.loadList[index].uid) {
			this.emailService.deleteList(this.loadList[index].uid).subscribe(
				res => {					
					if (res) {
						this.alertService.playToast('Success', 'Email List removed.', 0, 2000);
						this.loadList.splice(index, 1);
					}					
					else
						this.alertService.playToast('Failed', 'Email List is not removed.', 1, 2000);
				},
				err => {
					this.alertService.playToast('Failed', 'Email List is not removed.', 1, 2000);			   
				},
				() => {this.refreshView();}
			);
		}
	}

	moreList() {
		if (this.loadList[this.loadList.length-1].description == '') return;
		this.loadList.push({
			uid: UUID.UUID(),
			description: '',
			totalContact: 0
		})		
	}

	onKeypress(event: KeyboardEvent, index: number) {
		if (event.keyCode != 13) return;
		let s = (event.srcElement as HTMLInputElement).value.trim();
		if (this.isNewList(s))
			this.saveList(index, s);
		else
			this.alertService.playToast('Warning', 'The Same List already exists.', 2, 2000);
	}

	isNewList(s: string) {
		return this.loadList.findIndex(ll=>ll.description==s) < 0;
	}

	saveList(index: number, desc: string) {
		
		if (desc.trim() == '') return;

		this.loadList[index].description = desc.trim();
			
		this.emailService.insertList(this.loadList[index].description).subscribe(
			res => {
				if (!res) {
					this.alertService.playToast('Failed', 'Email List is not inserted.', 1, 2000);
				}
				else {
					this.alertService.playToast('Success', 'Email List inserted.', 0, 2000);
					this.loadList[index] = {
						description: res['description'],
						uid: res['uid'],
						totalContact: res['totalContact']
					};
					this.moreList();
				}
			},
			error => { this.alertService.playToast('Failed', 'Email List is not inserted.', 1, 2000); },
			() => {}
		);
	}

	onMerge() {
		let list = this.loadList.map(ll=>ll.description);

		let mergeWin = createMergeListWindow(this.windowService, list);		
		let mergeContactUid: Array<string> = [];

		mergeWin.componentRef.instance.submit.subscribe(res => {
			mergeWin.destroy();
			this.refreshView(true);
			let fromLists = (this.loadList.filter(ll=>res.fromLists.indexOf(ll.description)>=0)).map(fl=>fl.uid);

			if (res.isNew) {				
				this.emailService.insertList(res.toList).subscribe(
					res1 => {
						if (res) {
							if (this.loadList[this.loadList.length-1].description == '') {
								this.loadList[this.loadList.length-1] = {
									description: res1['description'],
									uid: res1['uid'],
									totalContact: res1['totalContact']
								};
							}
							else {
								this.loadList.push({
									description: res1['description'],
									uid: res1['uid'],
									totalContact: res1['totalContact']
								});
							}						
							this.mergeLists(fromLists, this.loadList[this.loadList.length-1]);							
						}
						else {
							this.refreshView();
							this.alertService.playToast('Failed', 'Lists are not merged.', 1, 2000);
						}
					},
					error => {
						this.refreshView();
						this.alertService.playToast('Failed', 'Lists are not merged.', 1, 2000);
					},
					() => {}
				);
			}
			else {
				let toLists = this.loadList.filter(ll=>ll.description == res.toList);				
				this.mergeLists(fromLists, toLists[0]);
			}
			
		});

		mergeWin.componentRef.instance.close.subscribe(res => {			
			mergeWin.destroy();
		});
		mergeWin.open();
	}   

	mergeLists(fromLists: string[], toList: List) {		
		this.emailService.moveLists(fromLists, toList.uid).subscribe(
			res=> {
				if (res) {
					this.alertService.playToast('Success', 'Lists merged.', 0, 2000);
					this.refreshView();
					this.emailList.setValue(toList.description);
				}
				else {				
					this.alertService.playToast('Failed', 'Lists are not merged.', 1, 2000);				
				}				
			},
			error => { this.alertService.playToast('Failed', 'Lists are not merged.', 1, 2000); },
			() => { this.refreshView(); }
		);
	}

	onSelectEmailList(isNew: boolean = false) {		
		if (isNew) {
			this.refresh();
		}
		if (!this.appService._currentUser) return;
		if (this.emailList.value == 'master') {			
			this._loading = true;		
			this.emailService.getContacts(this.contacts.length, this.pageSize, this.orderby).subscribe(
				res => {					
					if (!res) return;
					this.total = res['total'];
					this.contacts = [...this.contacts, ...res['data']];				
					this.setGridData();
				},
				error => { return; },
				() => {
					this._loading = false;
				}
			);
		}
		else {
			this.refreshView(true);
			let selectedList = this.loadList.filter(ll=>ll.description == this.emailList.value && ll.uid);
			this.skip = 0;			
			this.emailService.getInList(selectedList.length > 0 ? selectedList[0].uid : null, this.contacts.length, this.pageSize, this.orderby).subscribe(
				res => {					
					if (!res) return;
					this.total = res['total'];
					this.contacts = [...this.contacts, ...res['data']];
					this.setGridData();
				},
				error => {
					return;
				},
				() => { this.refreshView(); }
			);
		}
	}	

	toDate(selector: Date) {
		return moment(selector).format('DD/MM/YYYY');
	}
		
	export() {
		if (!this.allCheck.value && this.selectedContactUids.length == 0) return;

		let save_str: string = '';
		let arr = ['email', 'firstName', 'lastName', 'address1', 'address2'];
		this.contacts.forEach((element: Contact) => {
			if (this.selectedContactUids.indexOf(element.uid) != -1) {
				arr.forEach(key => {
					if (element[key] != undefined)
						save_str = save_str + element[key] + '\t';
				})
				save_str = save_str + '\n';
			}
		});
		const dataURI = "data:text/plain;base64," + encodeBase64(save_str);
		saveAs(dataURI, "email.txt");
	}   

	updateContact(contact: Contact) {
		this.emailService.updateContact(contact).subscribe(
			res => {
				if (res) {
					let index = this.contacts.findIndex(c=>c.uid == contact.uid);
					if (index>=0) {					
						this.contacts[index] = contact;
						this.setGridData();
					}				
					this.alertService.playToast('Success', 'Contact Information updated.', 0, 2000);
				}				
			},
			error => {this.alertService.playToast('Failed', 'Contact Information is not updated.', 1, 2000);},
			() => {}
		);
	}	

	/** Insert New List and Insert Contacts into the List */

	saveInLists(list: Array<string>, contactUids: Array<string>) {
		let newList: Array<string> = [];
		let existListUids: Array<string> = [];

		list.forEach(l=> {
			let index = this.loadList.findIndex(ll=>ll.description == l);
			if (index < 0 && l.trim() != '')
				newList.push(l.trim());
			else if (l.trim() != '')
				existListUids.push(this.loadList[index].uid);
		});	   

		if (newList.length > 0) {
			newList.forEach(l => {
				this.emailService.insertList(l).subscribe(
					res => {
						if (res) {
							let newList1: List = {
								description: res['description'],
								uid: res['uid'],
								totalContact: res['totalContact']
							};
							
							this.loadList.push(newList1);
		
							let in_list: InList = {
								contacts: contactUids,
								listUid: res['uid']
							};
		
							this.emailService.insertInList(in_list).subscribe(
								res => {
									if (res) {
										newList1.totalContact = contactUids.length;
									}							
								},
								err => {							
								}
							);
						}
						else {

						}
					},
					err => {
					},
					() => {}
				);
			});
		}

		existListUids.forEach(uid=> {
			let in_list: InList = {
				contacts: contactUids,
				listUid: uid
			};
						
			this.emailService.insertInList(in_list).subscribe(
				res => {				
					if (res) {
					}
					else {
					}
				},
				err => {
				}
			);
		});
		
		// if (list[0]) {
		//	 this.menuSelect.setValue('lists');
		//	 this.emailList.setValue(list[0]);
		// }
	}   

	isChecked(uid: string) {
		return this.selectedContactUids.indexOf(uid) >=0;
	}

	onShowDateFilter(show: boolean = true) {
		if (show)
			this.dateFilter.setValue(!this.dateFilter.value);
		else
			this.dateFilter.setValue(false);

		if (this.dateFilter.value == true) {
			// $(this.from.nativeElement).kendoDatePicker({ value: this._from });
			// $(this.from.nativeElement).change(t => { this._from = new Date(t.target['value']) });
			// $(this.to.nativeElement).kendoDatePicker({ value: this._to });
			// $(this.to.nativeElement).change(t => { this._to = new Date(t.target['value']) });
		}
	}

	onContactDetails(contact_uid: string) {
		let contact: Contact;
		let list = this.loadList.map(ll=>ll.description);
		this.emailService.getDetailsContact(contact_uid).subscribe(
			(c) => {			
				if (c != null)
					contact = {
						id: c.id,
						uid: c.uid,
						email: c.email,
						firstName: c.firstName,
						lastName: c.lastName,
						company: c.company,
						address1: c.address1,
						address2: c.address2,
						city: c.city,
						provinceId: c.provinceId,
						countryId: c.countryId,
						postalCode: c.postalCode,
						createDate: new Date(c.createDate).toLocaleDateString()
					};
				
				let contactDetailsWin = createContactDetailsWindow(this.windowService, contact, list);			
				contactDetailsWin.componentRef.instance.submit.subscribe(res => {				
					if (res.details.uid != undefined)
						this.saveInLists(res.list, [res.details.uid]);
					this.updateContact(res.details)
					contactDetailsWin.destroy();
				});
				contactDetailsWin.componentRef.instance.close.subscribe(res => {			
					contactDetailsWin.destroy();
				});
				contactDetailsWin.open();
			},
			error => {},
			() => {
			}
		);
	}   

	refreshView(loading = false) {
		this._loading = loading;		
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
