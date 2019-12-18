import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SparqlService {

  options = {
    headers: new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
  };

  constructor(private http: HttpClient) { }

  async query(url: string, query: string): Promise<any> {
    let body = new URLSearchParams();
    body.set('query', query);
    return this.http.post(url, body.toString(), this.options).toPromise();
  }
}
