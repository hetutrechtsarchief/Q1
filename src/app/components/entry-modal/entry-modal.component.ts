import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-entry-modal',
  templateUrl: './entry-modal.component.html',
  styleUrls: ['./entry-modal.component.scss']
})



export class EntryModalComponent implements OnInit {
  addedLinks = [];
  constructor() { }

  ngOnInit() {
    $( '#add-object-input' ).autocomplete({
      source( request, response ) {
        $('#add-object-selected-id').text("Searching for matching terms...");

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
    const predicate = $('#predicate-select').val();
    this.addedLinks.push({'predicate': predicate, 'object': object, 'url': objectURL});
  }

}
