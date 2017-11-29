import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-event-created',
  templateUrl: './event-created.component.html',
  styleUrls: ['./event-created.component.css']
})
export class EventCreatedComponent implements OnInit {

  eventCode:number;
  constructor(private router:Router,  private route: ActivatedRoute) { }

  ngOnInit() {
    this.eventCode = +this.route.snapshot.paramMap.get('eventPin');
  }

  goToEvent(){
    this.router.navigate([`/events/${this.eventCode}`]);
  }

}
