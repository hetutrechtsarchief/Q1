import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { SparqlService } from './sparql.service';
import { HttpClient } from '@angular/common/http';

interface Tile {
  head: {
    dim: number;
    x: number;
    y: number,
    z: number;
  };
  body: string[]; // Is a flat list; the tile server must use the head vars to parse this correctly
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
  imagesPerRow = 1024; // After images per row count has been reached, we will wrap to the next row

  constructor(private sparql: SparqlService, private http: HttpClient) { }

  async generateTile(data): Promise<string>  {
    console.log(data);
    let x = data.x;
    let y = data.y;
    let z = data.z;

    const tileImageList = await this.determineTileImages(z, x, y);
    return this.getTileUrl(tileImageList, ImageMapService.getDimByZ(z), {x, y, z});
  }

  private async getTileUrl(tileImageList: string[], dim: number, {x, y, z}): Promise<string> {
    const payload: Tile = {
      head: {
        dim: dim,
        x: x,
        y: y,
        z: z
      },
      body: tileImageList
    };
    console.log(payload); // DEBUG
    const response = await this.http.post('http://172.16.45.237:8081/post', payload).toPromise();
    return response['url'];
  }

  // XY: refers to tiles within the map
  // UV: refers to images within a single tile
  private async determineTileImages(z, x, y): Promise<string[]> {
    const dimUV = ImageMapService.getDimByZ(z);
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

  private async getImageRange(imageNumber: number, range = 1): Promise<string[]> {
    const query = `
      SELECT ?uuid WHERE {
        {
          SELECT ?uuid WHERE {
              ?bbitem rdf:type <http://www.europeana.eu/schemas/edm/ProvidedCHO> ;
                      <http://semanticweb.cs.vu.nl/2009/11/sem/hasBeginTimeStamp> ?time .
              BIND(REPLACE(str(?bbitem), "https://hetutrechtsarchief.nl/id/", "") AS ?uuid)
          }
          ORDER BY ASC(?time)
        }
      } LIMIT ${range} OFFSET ${imageNumber}
    `;
    const images = await this.sparql.query(environment.sparqlEndpoints.HuaBeeldbank, `${environment.sparqlPrefixes.HuaBeeldbank} ${query}`);

    return images.results.bindings.map((binding) => {
      return binding.uuid.value;
    });
  }

  private async getImageByCoords(coords: {lat, lng}) {
    const x = Math.floor(coords.lng);
    const y = Math.floor(coords.lat);

    const imageNumber = y * this.imagesPerRow + x;
    console.log(imageNumber, coords); // DEBUG

    if (imageNumber < 0) {
      console.error('Selection is out of range', imageNumber);  // DEBUG
      return;
    }

    // TODO: check if no image exists at that index (i.e., image number too high)
    console.log('Selected:', await this.getImageRange(imageNumber)); // DEBUG
  }

  /**
   * Mapping of z-index to images per row/col
   * z > dim
   * 1 > 64
   * 2 > 32
   * 3 > 16
   * 4 > 8
   * 5 > 4
   * 6 > 2
   * 7 > 1
   * @param z
   */
  private static getDimByZ(z: number) {
    if (z < 1 || z > 7) {
      console.warn(`A z-value of ${z} may not be supported by the tile server.`);
    }
    return Math.pow(2, 7 - z);
  }

}
