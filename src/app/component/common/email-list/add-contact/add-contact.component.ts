import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChild, ViewChildren, ElementRef, HostListener, Input, OnChanges, SimpleChanges, QueryList
} from '@angular/core';
import { Validators, Validator, FormControl, FormArray, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as XLSX from 'ts-xlsx';
import { read, IWorkBook } from 'ts-xlsx';
import { isNumber } from 'util';

import { CDValidation } from '@app-lib/validators/contact-duplicate-validator';
import { AttentionDialogComponent, createAttentionDialogWindow, AttentionInfo } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createAddListWindow, AddListComponent } from '@app-dialogs/add-list/add-list.component';

import { Folder, Tab, Category } from '@app/models';
import { Contact } from '@app-models/email-list';

import { AlertService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createAddContactWindow(
	windowService: WindowService,
	list: Array<string>,
	title: string = 'Add Contacts'
): DialogWindow<AddContactComponent> {
	return windowService.create<AddContactComponent>(
		AddContactComponent,
		{
			width: 540,
			height: 'auto',
			position: {
				left: 'calc(50% - 260px)',
				top: '50px'
			},
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.list = list;
		comp.title = title;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

export interface AddContactInfo {
	info: Array<Contact>;
	list: Array<string>;
	enableSend: boolean;
}

@Component({
	moduleId: module.id,
	selector: 'add-contact',
	templateUrl: 'add-contact.component.html',
	styleUrls: ['add-contact.component.css']
})
export class AddContactComponent implements OnInit, OnDestroy {

	@Input() title: string = 'Add Contacts';
	@Input() list: Array<string> = [];

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<AddContactInfo>();

	@ViewChild('importFile') private _importFile: ElementRef;
	@ViewChild('input') private _input: ElementRef;
	@ViewChildren('items') public _items: QueryList<ElementRef>;

	activeTab: Tab = { id: 'Type', name: 'Type' };
	tabs: Tab[] = [
			{ id: 'Type', name: 'Type' },
			{ id: 'Paste', name: 'Paste' },
			{ id: 'Import_File', name: 'Import File' },
			// { id: 'Import_Mycontacts', name: 'Import My Contacts'}
		];

	selectTab = new Rx.Subject<Tab>();
	filesSelected = new Rx.Subject<Event>();

	pasteString: Array<string> = [];
	importContacts: Array<any> = [];

	emailList: Array<string> = [];

	dropdownSelected: Array<string> = ['email'];

	filePath = new FormControl('');
	selectedRow = new FormControl(-1);

	pastEmails = new FormControl('', Validators.required);
	avoidSpam = new FormControl('', Validators.required);

	isValid = new FormControl(false);

	titles = ['Do Not Import', 'Email', 'First Name', 'Last Name', 'Company', 'Address 1', 'Address 2', 'City', 'State/Province', 'Country', 'Postal Code'];

	typeForms = new FormArray([
			new FormGroup({
				email: new FormControl('', [Validators.required, Validators.email]),
				firstName: new FormControl(''),
				lastName: new FormControl('')
			})
		]);

	public _loading: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService,
		private windowService: WindowService
	) { }

	ngOnInit() {

		this.subs = [
			this.selectTab.subscribe(r=> {
				this.activeTab = r;
				this.validate();
			}),

			this.typeForms.valueChanges.subscribe(res => {
				if (this.typeForms.valid)
					this.addTypeForm();
			}),

			this.filesSelected.subscribe(ev => {
				let fileReader = new FileReader();
				this.filePath.setValue(ev.target['value']);
				let files = (this._importFile.nativeElement as HTMLInputElement).files;
				if (files && files.length > 0) {
					let fileString = [];
					this.refreshView(true);
					fileReader.onloadend = () => {
						if (files[0].name.substr(files[0].name.length - 4, 4) == ".csv" || files[0].type == "text/plain") {

							let str: any = fileReader.result;
							let splitStr: string[] = [];

							if (files[0].type == "text/plain") {
								str = str.split(/"/).join("");
								str = str.split(/\n/).join(";");
								str = str.split(/\t/).join(";");
								str = str.split("  ").join(";");
								str = str.split(/\n/).join("");
								str = str.replace("   ", ";");
								splitStr = str.split(/;/);
							} else if (files[0].name.substr(files[0].name.length - 4, 4) == ".csv") {
								str = str.split(/\n/).join(",");
								splitStr = str.split(/,/);
							}

							if (splitStr && splitStr.length > 0) {
								splitStr.forEach(s => {
									if (s !== '')
										fileString.push(s);
								});
							}
							this.onImportLoad(fileString);
						} else if (files[0].name.substr(files[0].name.length - 4, 4) != ".csv" && (files[0].type == "application/vnd.ms-excel" || files[0].type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || files[0].type == "")) {

							let workbook = XLSX.read(fileReader.result, { type: 'binary' });
							let temp: string = workbook.Sheets[workbook.SheetNames[0]]['!ref'].toString();
							let row = parseInt(temp.substr(4, temp.length - 4));
							let column = (Object.keys(workbook.Sheets[workbook.SheetNames[0]]).length - 1) / row;
							let keys = Object.keys(workbook.Sheets[workbook.SheetNames[0]]);

							if (files[0].name.substr(files[0].name.length - 4, 4) == ".xls") {
								for (let i = 1; i < Object.keys(workbook.Sheets[workbook.SheetNames[0]]).length; i++)
									fileString.push(workbook.Sheets[workbook.SheetNames[0]][keys[i]]['v']);
							} else {
								for (let i = 1; i < Object.keys(workbook.Sheets[workbook.SheetNames[0]]).length; i++)
									fileString.push(workbook.Sheets[workbook.SheetNames[0]][keys[i]]['v']);
							}
							this.onImportLoad(fileString);
						} else {
							this.refreshView();
						}
					};
					fileReader.readAsBinaryString(files[0]);
				}
			}),

			this.pastEmails.valueChanges.subscribe((res) => {
				if (res)
					this.onPaste();
				else {
					this.pasteString = [];
					this.changeDetector.detectChanges();
				}
			}),

			this.avoidSpam.valueChanges.subscribe(() => {
				this.validate();
			}),

			Rx.Observable.merge(
				this.selectedRow.valueChanges,
				this.isValid.valueChanges
			).subscribe(() => this.changeDetector.detectChanges())
		];

		this.selectTab.next(this.tabs[0]);
	}

	@HostListener('keyup', ['$event'])
	@HostListener('click', ['$event'])
	onClick(event: Event) {
		if ((event.target as HTMLElement).tagName.toLocaleLowerCase() == 'input') {
			this.validate();
		}
		else {
			this.selectedRow.setValue(-1);
			this.changeDetector.detectChanges();
		}
	}

	onRemoveImportContact(index: number) {
		this.importContacts.splice(index, 1);
		this.selectedRow.setValue(-1);
		this.validate();
	}

	selectImportContact(index: number, i: number, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		this.selectedRow.setValue(index);
		setTimeout(() => {
			(this._items.toArray()[i].nativeElement as HTMLElement).focus();
		});
	}

	deselectImportContact(row: number, col: number, event: any) {
		this.importContacts[row][col] = event.srcElement.value;
	}

	selectDropDown(event: any, index: number) {
		let fieldName = this.changeStr(event.toString());
		if (!fieldName) return;

		if (this.dropdownSelected[index] == undefined)
			this.dropdownSelected.push(fieldName);
		else
			this.dropdownSelected[index] = fieldName;
	}

	changeStr(str: string) {
		if (str == 'First Name') return 'firstName';
		else if (str == 'Last Name') return 'lastName';
		else if (str == 'Company') return 'company';
		else if (str == 'Address 1') return 'address1';
		else if (str == 'Address 2') return 'address2';
		else if (str == 'City') return 'city';
		else if (str == 'State/Province') return 'provinceId';
		else if (str == 'Country') return 'provinceId';
		else if (str == 'Postal Code') return 'postalCode';
		else if (str == 'Email') return 'email1';
		return null;
	}

	onImportLoad(fileStr: string[]) {
		let flag = false;
		let fieldCount = 0;

		this.importContacts = [];

		for (let i = 0; i < fileStr.length; i++) {
			if (fileStr[i])
				if (fileStr[i].match(/@/)) {
					if (flag) {
						fieldCount = i;
						break;
					}
					flag = true;
				}
		}

		if (fieldCount == 0) {
			this.refreshView();
			return;
		}

		for (let i = 0; i < fileStr.length; i = i + fieldCount) {
			if (!fileStr[i]) continue;
			let s = [];
			for (let j = 0; j < fieldCount; j++) {
				s.push(fileStr[i + j]);
			}
			this.importContacts.push(s);
		}
		this.dropdownSelected = ['email'];
		this.refreshView();
	}

	onPaste() {
		let str = this.pastEmails.value.split(/\s/).join(";");
		str = str.split(/\n/).join(";");
		str = str.split(/\t/).join(";");
		str = str.split(";");

		this.pasteString = [];

		if (!str) {
			this.alertService.playToast('Failed', 'Invalid Data', 1, 2000);
			this.pastEmails.setValue('');
			return;
		}

		str.forEach(s => {
			if ( s != '') {
				let emailStr = s.match('[\\w\\d-\\+]+@[\\w\\d-]+\\.[\\w\\d]+');
				if (emailStr && emailStr.length > 0)
					this.pasteString.push(s);
			}
		});

		this.validate();
	}

	onCancelPaste() {
		this.pastEmails.setValue("");
	}

	onImportClick() {
		(this._importFile.nativeElement as HTMLInputElement).click();
	}

	onCancelImport() {
		this.importContacts = [];
		this.filePath.setValue('');
		this.selectedRow.setValue(-1);
	}

	validate() {
		if (this.activeTab.id == 'Type') {
			let cloneTypeForms: FormArray = lodash.cloneDeep(this.typeForms);
			cloneTypeForms.removeAt(cloneTypeForms.length-1);
			this.isValid.setValue(cloneTypeForms.length > 0 && cloneTypeForms.valid && this.avoidSpam.valid);
		}

		else if (this.activeTab.id == 'Paste') {
			this.isValid.setValue(this.pasteString.length > 0 && this.avoidSpam.valid);
		}

		else if (this.activeTab.id == 'Import_File') {
			this.isValid.setValue(this.importContacts.length > 0 && this.avoidSpam.valid);
		}
	}

	// =====================

	addTypeForm() {
		if (this.typeForms.invalid) return;
		this.typeForms.push(new FormGroup({
			email: new FormControl('', [Validators.required,Validators.email]),
			firstName: new FormControl(''),
			lastName: new FormControl('')
		}));
		this.validate();
	}

	removeTypeForm(i: number) {
		this.typeForms.removeAt(i);
	}

	onAddList() {
		let addListWin = createAddListWindow(this.windowService, this.list);

		addListWin.componentRef.instance.submit.subscribe(res => {
			if (res && res.list)
				this.emailList = res.list;
		});
		addListWin.componentRef.instance.close.subscribe(res => {
			addListWin.destroy();
		});
		addListWin.open();
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}

	refreshView(loading = false) {
		this._loading = loading;
		this.changeDetector.detectChanges();
	}

	onSubmit() {
		let date = new Date();
		let contacts: Contact[] = [];
		if (this.activeTab.id == 'Type') {
			this.typeForms.controls.forEach(form=> {
				if (form.valid) {
					contacts.push({
						email: form.value['email'],
						firstName: form.value['firstName'],
						lastName: form.value['lastName']
					})
				}
			})
		}
		else if (this.activeTab.id == 'Paste') {
			this.pasteString.forEach(s=> {
				contacts.push({email: s});
			});
		}
		else if (this.activeTab.id == "Import_File") {

			if (this.dropdownSelected.length < 2) {
				let attentionWindow = createAttentionDialogWindow(
					this.windowService,
					new AttentionInfo(
						{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
						[
							{ value: 'Choose Title for each Column', font_size: '14px', color: '#8c8c8c' },
							{ value: 'Some are missing', font_size: '14px', color: '#8c8c8c' },
						],
						true,
						['OK'],
						''
					));
				attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
					attentionWindow.destroy();
				});
				attentionWindow.open();
				return;
			}
			else {
				this.importContacts.forEach((data, i) => {
					let contact: Contact = {email: ''};
					this.dropdownSelected.forEach((d, j) => {
						contact[d] = data[j];
					});
					contacts.push(contact);
				});
			}
		}

		if (this.title == 'Add Guests') {
			let attentionWindow = createAttentionDialogWindow(
				this.windowService,
				new AttentionInfo(
					{ value: 'Confirmation', font_size: '18px', color: '#8c8c8c' },
					[
						{ value: 'New Guests will be added to an active invitation.', font_size: '16px', color: '#8c8c8c' },
						{ value: '', font_size: '16px', color: '#8c8c8c' },
						{ value: 'Wiil you send them an invitation?', font_size: '16px', color: '#8c8c8c' }
					],
					true,
					['Yes', 'No'],
					''
				));
			attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
				attentionWindow.destroy();
				this.submit.emit({info: contacts, list: this.emailList, enableSend: feedback});
			});
			attentionWindow.open();
			return;
		}
		else {
			this.submit.emit({info: contacts, list: this.emailList, enableSend: false});
		}
	}

	onClose(): void {
		this.close.emit();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
