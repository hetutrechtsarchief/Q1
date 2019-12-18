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
    const map = L.map('map', { crs: L.CRS.Simple }).setView([3, 3], 6);

    // @ts-ignore
    new TileLayerFunctional('/assets/demo/default.jpg', {
      maxNativeZoom: 7,
      maxZoom: 10,
      // minZoom: 4,
      // @ts-ignore
      tileLoaderFunction: async (data) => {
        const tile = await this.imageMap.generateTile(data);
        console.log(tile);
        return tile;
      }
    }).addTo(map);

    map.on('click', (ev) => {
      // Turn image number into query
      // @ts-ignore
      this.imageMap.getImageByCoords(ev.latlng);
    });
  }

}
