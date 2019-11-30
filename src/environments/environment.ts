// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  sparqlEndpoints: {
    HuaBeeldbank: 'https://api.druid.datalegend.net/datasets/hetutrechtsarchief/beeldbank/services/beeldbank/sparql'
  },

  sparqlPrefixes: {
  HuaBeeldbank: `
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX edm: <http://www.europeana.eu/schemas/edm/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>`
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
