import * as L from 'leaflet';
import * as DomEvent from 'leaflet/src/dom/DomEvent';
import * as Util from 'leaflet/src/core/Util';
import { Browser, Point } from 'leaflet';

export class TileLayerFunctional extends L.TileLayer {
  tileLoaderFunction: (data) => Promise<string>;

  // Replicates original function, except for setting _tileFunction.
  initialize(url, options) {
    // @ts-ignore
    this._url = url;

    options = Util.setOptions(this, options);
    this.tileLoaderFunction = options.tileLoaderFunction;

    // detecting retina displays, adjusting tileSize and zoom levels
    if (options.detectRetina && Browser.retina && options.maxZoom > 0) {

      options.tileSize = Math.floor(options.tileSize / 2);

      if (!options.zoomReverse) {
        options.zoomOffset++;
        options.maxZoom--;
      } else {
        options.zoomOffset--;
        options.minZoom++;
      }

      options.minZoom = Math.max(0, options.minZoom);
    }

    if (typeof options.subdomains === 'string') {
      options.subdomains = options.subdomains.split('');
    }

    // for https://github.com/Leaflet/Leaflet/issues/137
    if (!Browser.android) {
      // @ts-ignore
      this.on('tileunload', this._onTileRemove);
    }
  }

  // Replicates original function, except for triggering loadActualTile().
  createTile(coords, done) {
    var tile = document.createElement('img');

    // @ts-ignore
    DomEvent.on(tile, 'load', Util.bind(this._tileOnLoad, this, done, tile));
    // @ts-ignore
    DomEvent.on(tile, 'error', Util.bind(this._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    /*
     Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
     http://www.w3.org/TR/WCAG20-TECHS/H67
    */
    tile.alt = '';

    /*
     Set role="presentation" to force screen readers to ignore this
     https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
    */
    tile.setAttribute('role', 'presentation');

    // @ts-ignore
    tile.src = this.getTileUrl(coords);

    this.loadActualTile(coords, tile);

    return tile;
  }

  //
  async loadActualTile(coords, tile) {
    const actualTileUrl = await this.getActualTileUrl(coords);
    if (actualTileUrl) {
      tile.src = actualTileUrl;
    } // else, don't replace
  }

  async getActualTileUrl(coords): Promise<string> {
    const data = {
      r: Browser.retina ? '@2x' : '',
      // @ts-ignore
      s: this._getSubdomain(coords),
      x: coords.x,
      y: coords.y,
      z: this._getZoomForUrl()
    };

    const url = await this.tileLoaderFunction(data);
    return url;
  }
}
