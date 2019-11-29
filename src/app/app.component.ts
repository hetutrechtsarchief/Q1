import {Component, OnInit} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    const map = L.map('map', { crs: L.CRS.Simple }).setView([3, 3], 0);

    // @ts-ignore
    L.tileLayer('/assets/demo/z{z}_x{x}_y{y}.jpg', {
      maxNativeZoom: 2,
      maxZoom: 10
    }).addTo(map);
  }
}
