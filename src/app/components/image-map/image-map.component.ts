import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { TileLayerFunctional } from '../../helper/TileLayerFunctional';
import { ImageMapService } from '../../services/image-map.service';

@Component({
  selector: 'app-image-map',
  templateUrl: './image-map.component.html',
  styleUrls: ['./image-map.component.scss']
})
export class ImageMapComponent implements OnInit {

  constructor(private imageMap: ImageMapService) { }

  async ngOnInit() {
    this.imageMap.generateTile();
    const map = L.map('map', { crs: L.CRS.Simple }).setView([3, 3], 0);

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

    map.on('click', (ev) => {
      // Turn image number into query
      // @ts-ignore
      this.imageMap.getImageByCoords(ev.latlng);
    });
  }

}
