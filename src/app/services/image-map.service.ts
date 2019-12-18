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

@Injectable({
  providedIn: 'root'
})
export class ImageMapService {
  imagesPerRow = 1024; // After images per row count has been reached, we will wrap to the next row
                    // WARNING: make sure this is a power of 2, or expect trouble; the tile server
                    // won't understand placement correctly if tile rows are not fully filled

  constructor(private sparql: SparqlService, private http: HttpClient) { }

  async generateTile(data): Promise<string>  {
    let x = data.x;
    let y = data.y;
    let z = data.z;

    // Check first if in range
    if ( x < 0 || y < 0 || x >= this.imagesPerRow / ImageMapService.getDimByZ(z)) {
      return null;
    }

    const tileImageList = await this.determineTileImages(z, x, y);
    return this.getTileUrl(tileImageList, ImageMapService.getDimByZ(z), {x, y, z});
  }

  private async getTileUrl(tileImageList: string[], dim: number, {x, y, z}): Promise<string> {
    // Check if payload is empty. If so, don't replace default url
    if (tileImageList.length === 0) {
      return null;
    }

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

    const response = await this.http.post('http://172.20.10.3:8080/post.php', payload).toPromise();
    return response['url'];
  }

  // XY: refers to tiles within the map
  // UV: refers to images within a single tile
  private async determineTileImages(z, x, y): Promise<string[]> {
    const dimUV = ImageMapService.getDimByZ(z);
    const tilesPerRow = this.imagesPerRow / dimUV;
    const imagesPerTile = Math.pow(dimUV, 2);
    const imagesPerTileRow = tilesPerRow * imagesPerTile;

    // Cycle through all squares in the grid
    const imageNumberArray: number[] = [];
    for(let v = 0; v < dimUV; v++) { // per row
      // Get number of first image in this row
      const imageNumber = y * imagesPerTileRow // Add all full tiles above it
        + v * this.imagesPerRow // Add all full lines above it in same-rowed tiles
        + x * dimUV; // Add all full columns left to tile

      imageNumberArray.push(imageNumber);
    }
    console.log(imageNumberArray); // DEBUG
    return await this.getImageRange(imageNumberArray, dimUV);
  }

  private async getImageRange(imageNumberArray: number[], range = 1): Promise<string[]>  {
    let query = `
      SELECT ?uuid WHERE {
    `;

    for (let imageNumber of imageNumberArray) {
      if (imageNumber < 0) {
        continue;
      }
      query = query + `
        {
            SELECT ?uuid WHERE  {
              SELECT ?uuid WHERE {
                  ?bbitem rdf:type <http://www.europeana.eu/schemas/edm/ProvidedCHO> ;
                  <http://semanticweb.cs.vu.nl/2009/11/sem/hasBeginTimeStamp> ?time .
                  BIND(REPLACE(str(?bbitem), "https://hetutrechtsarchief.nl/id/", "") AS ?uuid)
              }
              ORDER BY ASC(?time)
             } LIMIT ${range} OFFSET ${imageNumber}
        }
        UNION`
    }

    query = query.slice(0, query.length - 5) + `}`;

    // Check if query is not empty
    if (query.trim() === `SELECT ?uuid WHERE {}`) {
      console.warn('Empty tile selection; all indices were out of range / negative.');
      return [];
    }

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
    console.log('Selected:', await this.getImageRange([imageNumber])); // DEBUG
  }

  /**
   * Mapping of z-index to images per row/col
   * z > dim / map units
   * 0 > 128 (WARNING: Unsupported)
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
