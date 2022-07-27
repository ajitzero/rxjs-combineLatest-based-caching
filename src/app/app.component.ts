import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { DateTime } from "luxon";
import { combineLatest, interval, Subject } from "rxjs";
import {
  debounceTime,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs/operators";

interface Log {
  title: string;
  obj: Todo | null;
  timestamp: string;
}
interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: "app-root",
  template: `
    <button (click)="clear()">clear</button>
    <button (click)="refresh()">refresh</button>
    <ul>
      <li *ngFor="let log of logs">
        <code
          >{{ log.timestamp }} : {{ log.title }} | {{ log.obj | json }}</code
        >
      </li>
    </ul>
  `
})
export class AppComponent {
  private readonly baseUrl = "https://jsonplaceholder.typicode.com";

  refreshInterval$ = interval(5000); // 3sec
  refresh$ = new Subject<void>();
  refresh() {
    this.refresh$.next();
  }
  private refreshTimers$ = combineLatest([
    this.refresh$.pipe(startWith(0)),
    this.refreshInterval$.pipe(startWith(0)),
  ]).pipe(
    debounceTime(750),
  );

  todo1 = this.refreshTimers$.pipe(
    switchMap(() => this.http.get<Todo>(this.baseUrl + "/todos/1")),
    shareReplay(1),
  );
  todo2 = this.refreshTimers$.pipe(
    switchMap(() => this.http.get<Todo>(this.baseUrl + "/todos/2")),
    shareReplay(1),
  );

  constructor(private http: HttpClient) {
    this.log("ctor, init");
    this.refresh$.subscribe(() => {
      this.log("refresh");
    });
    this.refreshInterval$.subscribe(() => {
      this.log("interval");
    });

    // const tsub1 = this.todo1.subscribe(data => {
    //   this.log('todo1', data);
    // });
    // const psub1 = this.todo2.subscribe(data => {
    //   this.log('todo2', data);
    // });
    // const tsub2 = this.todo1.subscribe(data => {
    //   this.log('todo1 again', data);
    // });
    // const psub2 = this.todo2.subscribe(data => {
    //   this.log('todo2 again', data);
    // });

    const clx = combineLatest([this.todo1, this.todo2])
    clx
      .pipe(debounceTime(750))
      .subscribe((cl) => {
        this.log("cl[0]", cl[0]);
        this.log("cl[1]", cl[1]);
      });

    clx
      .pipe(debounceTime(750))
      .subscribe((cl) => {
        this.log("cl[0] again", cl[0]);
        this.log("cl[1] again", cl[1]);
      });

    // forkJoin fails for streams of "one-time only" data
    // forkJoin({
    //   t: this.todo1,
    //   p: this.todo2,
    // }).subscribe(fj => {
    //   this.log('fj.t', fj.t);
    //   this.log('fj.p', fj.p);
    // });
    // forkJoin({
    //   t: this.todo1,
    //   p: this.todo2,
    // }).subscribe(fj => {
    //   this.log('fj.t again', fj.t);
    //   this.log('fj.p again', fj.p);
    // });
  }

  logs: Log[] = [];
  log(title: string, obj: Todo | null = null) {
    this.logs.push({
      title,
      obj,
      timestamp: DateTime.now().toFormat("HH:mm:ss:SSS")
    });
  }
  clear() {
    this.logs = [];
  }
}
