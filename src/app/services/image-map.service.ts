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
  images;
  imagesPerRow = 1024;
  maxVerticalTiles = 8;

  constructor(private sparql: SparqlService, private http: HttpClient) { }

  async generateTile() {
    let x = 0;
    let y = 0;
    let z = 4;


    const query = `
      SELECT ?uuid WHERE {
        ?bbitem rdf:type <http://www.europeana.eu/schemas/edm/ProvidedCHO> .
        BIND(REPLACE(str(?bbitem), "https://hetutrechtsarchief.nl/id/", "") AS ?uuid)
      } LIMIT ${ this.imagesPerRow * this.maxVerticalTiles }
    `;
    this.images = await this.sparql.query(environment.sparqlEndpoints.HuaBeeldbank, `${environment.sparqlPrefixes.HuaBeeldbank} ${query}`);
    console.log(this.images); // DEBUG
    const tileImageMatrix = this.determineTileImages(z, x, y);
    this.getTileUrl(tileImageMatrix, this.getDimByZ(z));
  }

  getTileUrl(tileImageMatrix: string[][], dim: number) {
    const payload = {
      head: {
        dim: dim
      },
      body: tileImageMatrix
    };
    console.log('started call');
    console.log(payload);
    this.http.post('http://172.16.45.237:8081/post', payload).subscribe((response) => {
      console.log(response);
    });
  }

  // XY: refers to tiles within the map
  // UV: refers to images within a single tile
  determineTileImages(z, x, y): string[][] {
    const dimUV = this.getDimByZ(z);
    const dimXY = this.imagesPerRow / dimUV;

    // Cycle through all squares in the grid
    const imageGrid: string[][] = [];
    for(let v = 0; v < dimUV; v++) { // per row
      const imageRow: string[] = [];
      for(let u = 0; u < dimUV; u++) { // per column
        const imageNumber = y * Math.pow(dimXY, 2) * dimXY // Add all full tiles above it
          + v * dimUV * dimXY // Add all full lines above it in same-rowed tiles
          + x * dimUV // Add all full columns left to tile
          + u; // Add column within tile to the left

        // Get image on the right level
        const currentImage = this.images.results.bindings[imageNumber].uuid.value;
        imageRow.push(currentImage);

        // imageRow.push(imageNumber.toString()); // DEBUG
      }
      imageGrid.push(imageRow);
    }
    console.log(imageGrid); // DEBUG
    return imageGrid;
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
