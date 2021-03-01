import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AirportService {

  baseUrl = `http://www.angular.at/api`;

  constructor(private http: HttpClient) {
  }

  findAll(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/airport`);
  }
}
