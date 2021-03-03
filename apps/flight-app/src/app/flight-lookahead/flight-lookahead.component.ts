import {Component, OnInit} from '@angular/core';
import {FormControl} from "@angular/forms";
import {Flight} from "@flight-workspace/flight-lib";
import {combineLatest, interval, Observable, of, pipe, Subject} from "rxjs";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  switchMap,
  tap
} from "rxjs/operators";

type Projector<T, U> = (item: T) => Observable<U>;

function switchMapCompensate<T,U>(projector: Projector<T,U>) {
  return pipe(
    switchMap( (p:T) => projector(p).pipe(
      catchError(_ => of([]))
    ))
  );
}


@Component({
  selector: 'flight-workspace-flight-lookahead',
  templateUrl: './flight-lookahead.component.html',
  styleUrls: ['./flight-lookahead.component.css']
})
export class FlightLookaheadComponent implements OnInit {

  control: FormControl;

  flights$: Observable<Flight[]>;

  loading: boolean;

  online: boolean = false;
  online$: Observable<boolean>;

  basket$: Observable<Flight[]>;

  private addToBasketSubject = new Subject<Flight>();
  addToBasket$ = this.addToBasketSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.control = new FormControl();

    this.online$ = interval(2000).pipe(
      startWith(0),
      // map(_ => Math.random() < 0.5),
      map(_ => true),
      distinctUntilChanged(),
      tap(value => this.online = value)
    );

    const input$ = this.control.valueChanges.pipe(
      debounceTime(300));

    this.flights$ = combineLatest([input$, this.online$]).pipe(
      filter(( [, online]) => online),
      tap(x => this.loading = true),
      map( ([input]) => input),
      switchMapCompensate(input => this.load(input)),
      tap(x => this.loading = false)
    );

    this.basket$ = this.addToBasket$.pipe(
      scan((acc, flight) => {
        return [...acc, flight]
      }, [])
    );
  }

  load(from: string): Observable<Flight[]> {
    const params = new HttpParams().set('from', from);
    const headers = new HttpHeaders()
      .set('Accept', 'application/json');

    return this.http
      .get<Flight[]>(`http://www.angular.at/api/flight`, {params, headers});
  }

  select(flight: Flight) {
    this.addToBasketSubject.next(flight);
  }
}
