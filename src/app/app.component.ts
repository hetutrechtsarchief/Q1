import { Component, OnInit } from '@angular/core';
import { TileLayerFunctional } from './helper/TileLayerFunctional';

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
    // @ts-ignore
    new TileLayerFunctional('/assets/demo/default.jpg', {
      maxNativeZoom: 2,
      maxZoom: 10,
      // @ts-ignore
      tileLoaderFunction: async (data) => {
        return await new Promise((resolve, reject) => {
          setTimeout(() => {
            // TODO: replace with call to image server
            const  url = '/assets/demo/z{z}_x{x}_y{y}.jpg'
              .replace('{z}', data.z)
              .replace('{x}', data.x)
              .replace('{y}', data.y)
              .replace('{s}', data.s);
            resolve(url);
          }, 0);
        });
      }
    }).addTo(map);
  }
}


