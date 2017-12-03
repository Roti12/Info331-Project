import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  private startDate:Date;
  private eventName: string;

  constructor(private http:HttpClient, private route: ActivatedRoute) { }

  ngOnInit() {
    const event = JSON.parse(localStorage.getItem('event'));
    this.startDate = event.startDate;
    this.eventName = event.name;
  }

  uploadPictures(image:any){

    const eventPin = +this.route.snapshot.paramMap.get('eventPin');
    const jwt = localStorage.getItem('jwt');

    var file:{} = {
      name:image.target.files[0].name,
      type:image.target.files[0].type,
      size:image.target.files[0].size,
    };

    // Make the HTTP request:
    this.http.post(`/api/events/${eventPin}/images`,{fileMetadata:file},
    { headers:new HttpHeaders().set('Authorization', `Bearer ${jwt}`) }).subscribe(urlData => {
      console.log(urlData['url']);
      this.http.put(urlData['url'], image.target.files[0],   { headers:new HttpHeaders().set('Content-Type', file['type']), responseType: 'text' }).subscribe(data => {
          console.log(data);
      });
    });
  }

}
