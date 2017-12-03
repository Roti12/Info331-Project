import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router'
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit {

  private results: string[] = [];
  private eventCode:number;
  private startDate:Date;
  private eventName: string;
  private getUrl:string = "http://localhost:3000/api/events/" + 1000 + "/images";
  //private defaultPath:string = "~/git/Info331-Project/";

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.eventCode = +this.route.snapshot.paramMap.get('eventPin');
    const event = JSON.parse(localStorage.getItem('event'));
    this.startDate = event.startDate;
    this.eventName = event.name;
    // Make the HTTP request:
    // this.http.get('http://localhost:3000/api/events/1000/images',
    const jwt = localStorage.getItem('jwt');
    this.http.get(`/api/events/${this.eventCode}/images`,
    { headers:new HttpHeaders().set('Authorization', `Bearer ${jwt}`) }).subscribe(data => {
      // Read the result field from the JSON response.
      //this.results.push(data.toString());
      //console.log(data[0].path);
      console.log(this.getUrl);
      for(var image in data){
        console.log(data[image].safeSearch);
        if(!(data[image].safeSearch.adult.includes("VERY_LIKELY") || data[image].safeSearch.violence.includes("VERY_LIKELY"))){
          this.results.push(data[image].path);
          console.log(data[image].path);
        }
      }
      //img src: ""
      //this.results = data['code'];
      // console.log("tostring: " + data.toString());
      // console.log("kun data: " + data);
      // console.log("---- valueOf ----" + data.valueOf());
      // console.log("---- this.results ----" + this.results);
    });
  }





}
