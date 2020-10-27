import { Component, ElementRef, ChangeDetectorRef, NgZone, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { } from 'google-maps';
import { MapsAPILoader } from '@agm/core';
import * as Rx from 'rxjs/Rx';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createGoogleMapsDialogWindow(
	windowService: WindowService,
	inputLocation: string
): DialogWindow<GoogleMapsDialogComponent> {
	return windowService.create<GoogleMapsDialogComponent>(
		GoogleMapsDialogComponent,
		{
			width: 950,			
			height: 620,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.inputLocation = inputLocation;		
		comp.close.subscribe(() => window.close());
	});
}

@Component({
    moduleId: module.id,
    selector: 'google-maps-dialog',
	templateUrl: 'google-maps-dialog.component.html',
	styleUrls: ['google-maps-dialog.component.css']
})

export class GoogleMapsDialogComponent implements OnInit {

    @Input('location') inputLocation: string = '';
    @Output('location') outLocation = new EventEmitter<string>();
    @Output('close') close = new EventEmitter<void>();
    
    @ViewChild('searchText')
    public searchElementRef: ElementRef;

    public autocomplete: google.maps.places.Autocomplete;
    public geocoder: google.maps.Geocoder;

    public latitude: number;
    public longitude: number;
    public searchControl: FormControl;
    public zoom: number;   

    constructor(
            private mapsAPILoader: MapsAPILoader,            
            private _changeDetector: ChangeDetectorRef,
        ) {}

    ngOnInit() {
        //set google maps defaults
        this.zoom = 12;
        this.latitude = 39.8282;
        this.longitude = -98.5795;

        //create search FormControl
        this.searchControl = new FormControl(this.inputLocation);           

        //load Places Autocomplete
        this.mapsAPILoader.load().then(() => {
            this.geocoder = new google.maps.Geocoder();
            this.setPosition();
            this.autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
                types: ['address']
            });
            this.autocomplete.addListener("place_changed", () => {                    
                // //get the place result                        
                let place: google.maps.places.PlaceResult = this.autocomplete.getPlace();        
                //verify result
                if (place.geometry === undefined || place.geometry === null) {
                    return;
                }

                //set latitude, longitude and zoom
                this.latitude = place.geometry.location.lat();
                this.longitude = place.geometry.location.lng();                    
                this._changeDetector.detectChanges();                    
            });
        });
    }

    private setPosition() {        
        let address = this.searchControl.value;
        this.geocoder.geocode({'address': address}, (results, status: any) => {
            if (status === 'OK') {
                this.latitude = results[0].geometry.location.lat();
                this.longitude = results[0].geometry.location.lng();
            }
            this._changeDetector.detectChanges();           
        });
    }    

    private setCurrentPosition() {        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.latitude = position.coords.latitude;
                this.longitude = position.coords.longitude;
                this.zoom = 12;
            });
        }
    }

    onClose($event) {        
        this.close.emit();
    }
}