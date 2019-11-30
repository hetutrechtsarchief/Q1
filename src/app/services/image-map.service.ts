import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { SparqlService } from './sparql.service';
import { HttpClient } from '@angular/common/http';

interface Tile {
  head: {
    dim: number;
  };
  body: number[][];
}

// Tile mapping:
// UNUSED 0: 128 map units
// 1: 64 map units
// 2: 32 map units
// 3: 16 map units
// 4: 8 map units
// 5: 4 map units
// 6: 2 map units
// 7: 1 map units

@Injectable({
  providedIn: 'root'
})
export class ImageMapService {
  imagesPerRow = 1024;
  maxVerticalTiles = 1;
  maxImages;

  constructor(private sparql: SparqlService, private http: HttpClient) { }

  async generateTile() {
    let x = 0;
    let y = 0;
    let z = 4;
    this.maxImages = this.imagesPerRow * this.getDimByZ(1) * this.maxVerticalTiles;

    const tileImageList = await this.determineTileImages(z, x, y);
    this.getTileUrl(tileImageList, this.getDimByZ(z), {x, y, z});
  }

  getTileUrl(tileImageList: string[], dim: number, {x, y, z}) {
    const payload = {
      head: {
        dim: dim,
        x: x,
        y: y,
        z: z
      },
      body: tileImageList
    };
    console.log(payload); // DEBUG
    this.http.post('http://172.16.45.237:8081/post', payload).subscribe((response) => {
      console.log(response);
    });
  }

  // XY: refers to tiles within the map
  // UV: refers to images within a single tile
  async determineTileImages(z, x, y): Promise<string[]> {
    const dimUV = this.getDimByZ(z);
    const dimXY = this.imagesPerRow / dimUV;

    // Cycle through all squares in the grid
    const imageList: string[] = [];
    for(let v = 0; v < dimUV; v++) { // per row
      // Get number of first image in this row
      const imageNumber = y * Math.pow(dimXY, 2) * dimXY // Add all full tiles above it
        + v * dimUV * dimXY // Add all full lines above it in same-rowed tiles
        + x * dimUV; // Add all full columns left to tile

      const imageRange = await this.getImageRange(imageNumber, dimUV);
      imageRange.forEach((imageId) => {
        imageList.push(imageId);
      });
      // console.log(imageRange); // DEBUG

      // imageList.push(imageNumber.toString()); // DEBUG, use to verify correct ordering
    }
    console.log(imageList); // DEBUG
    return imageList;
  }

  async getImageRange(imageNumber: number, range = 1): Promise<string[]> {
    const query = `
      SELECT ?uuid WHERE {
        ?bbitem rdf:type <http://www.europeana.eu/schemas/edm/ProvidedCHO> ;
                <http://semanticweb.cs.vu.nl/2009/11/sem/hasBeginTimeStamp> ?time .
        BIND(REPLACE(str(?bbitem), "https://hetutrechtsarchief.nl/id/", "") AS ?uuid)
      } ORDER BY ASC(?time) LIMIT ${range} OFFSET ${imageNumber}
    `;
    const images = await this.sparql.query(environment.sparqlEndpoints.HuaBeeldbank, `${environment.sparqlPrefixes.HuaBeeldbank} ${query}`);

    return images.results.bindings.map((binding) => {
      return binding.uuid.value;
    });
  }

  async getImageByCoords(coords: {lat, lng}) {
    const x = Math.floor(coords.lng);
    const y = Math.floor(coords.lat);

    const imageNumber = y * this.imagesPerRow + x;
    console.log(imageNumber, coords); // DEBUG

    if (imageNumber > this.maxImages || imageNumber < 0) {
      console.error('Selection is out of range', imageNumber);  // DEBUG
      return;
    }
    console.log('Selected:', await this.getImageRange(imageNumber)); // DEBUG
  }

  getDimByZ(z: number) {
    switch (z) {
      case (1):
        return 64; // 2^6
      case (2):
        return 32; // 2^5
      case (3):
        return 16; // 2^4
      case (4):
        return 8; // 2^3
      case (5):
        return 4; // 2^2
      case (6):
        return 2; // 2^1
      case (7):
        return 1; // 2^0
    }
  }

}
