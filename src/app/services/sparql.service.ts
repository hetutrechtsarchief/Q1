import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SparqlService {

  constructor(private http: HttpClient) { }

  async query(url: string, query: string): Promise<any> {
    const fullUrl =  `${url}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on`;
    return this.http.get(fullUrl).toPromise();
  }
}
