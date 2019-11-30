import { Component, OnInit } from '@angular/core';
import {SparqlService} from '../../services/sparql.service';
import {environment} from '../../../environments/environment';
import {md5} from './md5';

@Component({
  selector: 'app-entry-modal',
  templateUrl: './entry-modal.component.html',
  styleUrls: ['./entry-modal.component.scss']
})



export class EntryModalComponent implements OnInit {
  addedLinks = [];
  beeldbankGuid = '0003D2B2CF6E510F9A2BA5AE7AC62FB7';
  imageUrl = 'https://proxy.archieven.nl/download/39/' + this.beeldbankGuid;

  constructor(private sparql: SparqlService) { }
  //https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Qxxx&property=P18

  async retrieveWikidata(wikidataId, linkIndex) {
    // Get description
    $.ajax({
      url: '//www.wikidata.org/w/api.php',
      data: { action: 'wbgetentities', ids: wikidataId, format: 'json' },
      dataType: 'jsonp',
      success: (x) => {
        console.log(x);
        console.log('wb label', x.entities[wikidataId].labels.en.value);
        this.addedLinks[linkIndex]['description'] = x.entities[wikidataId].descriptions.en.value;
      }
    });

    // Get image
    $.ajax({
      url: '//www.wikidata.org/w/api.php',
      data: { action: 'wbgetclaims', entity: wikidataId, property: 'P18', format: 'json' },
      dataType: 'jsonp',
      success: (x) => {
        const imageFileName = x.claims.P18[0].mainsnak.datavalue.value.replace(/\s/g, '_');
        const md5Hash = md5(imageFileName);
        const a = md5Hash[0];
        const b = md5Hash[1];
        this.addedLinks[linkIndex]['image'] = 'https://upload.wikimedia.org/wikipedia/commons/'
          + a + '/' + a + b + '/' +
          imageFileName;
      }
    });
  }
  async retrieveTags() {
    let query: string;
    query = `
      SELECT ?trefwoordGuid ?trefwoordLabel ?wikidataUri WHERE {
        <${'http://hetutrechtsarchief.nl/id/' + this.beeldbankGuid}> dct:subject ?trefwoordGuid .
        ?trefwoordGuid rdfs:label ?trefwoordLabel .
        ?trefwoordGuid owl:sameAs ?wikidataUri
      } LIMIT 100
    `;
    const queryResult = await this.sparql.query(environment.sparqlEndpoints.HuaBeeldbank,
      `${environment.sparqlPrefixes.HuaBeeldbank} ${query}`);
    const trefwoordGuid = queryResult.results.bindings[0].trefwoordGuid.value;
    const trefwoordLabel = queryResult.results.bindings[0].trefwoordLabel.value;
    const wikidataUri = queryResult.results.bindings[0].wikidataUri.value;
    $('#tag').html('<a target="_blank" href="' + wikidataUri + '">'
      + trefwoordLabel +
      '</a>');
    $('#tag').attr('title', "Wikidata: " + wikidataUri + "\n" +
      "HUA: " + trefwoordGuid);
  }

  async retrieveDescription() {
    let query: string;
    query = `
      SELECT ?description WHERE {
        <${'https://hetutrechtsarchief.nl/id/' + this.beeldbankGuid}> dc:description ?description .
      } LIMIT 100
    `;

    const queryResult = await this.sparql.query(environment.sparqlEndpoints.HuaBeeldbank,
      `${environment.sparqlPrefixes.HuaBeeldbank} ${query}`);
    $('#description').html('<i>Beschrijving</i>: ' + queryResult.results.bindings[0].description.value);
  }
  ngOnInit() {
  this.retrieveDescription();
  this.retrieveTags();

  ($( '#add-object-input' ) as any).autocomplete({
      source( request, response ) {
        $('#add-object-selected-id').text('Searching for matching terms...');

        $.ajax( {
          url: 'http://demo.netwerkdigitaalerfgoed.nl:8080/nde/graphql',
          contentType: 'application/json',
          type: 'POST',
          data: JSON.stringify({ query: 'query {\n' +
              '  terms(match:"*' + request.term + '*" dataset:["wikidata"]) { dataset terms {uri prefLabel altLabel definition scopeNote } }\n' +
              '}',
            variables: null}),
          success(result) {
            const prefLabels = [];
            const resultData = result.data.terms[0]; // First datasource
            console.log(resultData);
            for (let i = 0; i < resultData.terms.length - 1; i++) {
              prefLabels[i] = {
                label: resultData.terms[i].prefLabel.join() + ' (' + resultData.terms[i].altLabel.join() + ')',
                wikiDataUri: resultData.terms[i].uri
              };
            }
            response(prefLabels);
          }
        } );
      },
      minLength: 3,
      select( event, ui ) {
        $('#add-object-selected-id').html('<a target="_blank" href="' + ui.item.wikiDataUri + '">' + ui.item.wikiDataUri + '</a>');
        // console.log( 'Selected: ' + ui.item.value + ' aka ' + ui.item.wikiDataUri );
      }
    });
  }

  onAddLink() {
    const object = $('#add-object-input').val();
    const objectURL = $('#add-object-selected-id a').attr('href');
    const wikidataId = objectURL.replace("http://www.wikidata.org/entity/","");
    const predicate = $('#predicate-select').val();
    this.addedLinks.push({predicate, object, url: objectURL, description: "Laden..."});

    this.retrieveWikidata(wikidataId, this.addedLinks.length-1);
  }

}
