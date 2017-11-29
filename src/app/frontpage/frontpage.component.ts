import { Component, OnInit, OnDestroy } from '@angular/core';
import { Route, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.css']
})
export class FrontpageComponent implements OnInit, OnDestroy {

  constructor(private router:Router, private http: HttpClient) { }

  ngOnInit() {
    document.body.style.backgroundImage = "url('../assets/images/fijiidk.jpg')";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundSize = "cover";
  }

  ngOnDestroy(){
    document.body.style.backgroundImage = "none";
  }

  eventPin:number;
  errorMessage:string;

  joinEvent(eventPin:number, password:string, wrongPin:HTMLDivElement){
    if(!password) password = "";
    if(eventPin){
      this.eventPin = eventPin;
      this.http.post(`/api/events/${eventPin}/login`, {password: password}, {responseType: 'text'}).subscribe(jwt => {
        console.log(jwt);
        localStorage.setItem('jwt', jwt );
        this.http.get(`/api/events/${eventPin}`,
          { headers:new HttpHeaders().set('Authorization', 'Bearer ' + jwt) }).subscribe(event => {
            console.log(event);
            localStorage.setItem('event', JSON.stringify(event));
            if(event['status'] === "viewable" || event['status'] === "over")
              this.router.navigate(['/events', eventPin]);
            else
              this.router.navigate(['/upload', eventPin]);
        });
      },
      err => {
        this.errorMessage = err.error;
        wrongPin.style.display = 'block';
      });
    }
    else {
      this.errorMessage = 'Please enter a pin!';
      this.eventPin = eventPin;
      wrongPin.style.display = 'block';
    }

  }

}
