import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { DownloadComponent } from './event/download/download.component';
import { MainContentComponent } from './event/main-content/main-content.component';
import { EventComponent } from './event/event.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { FrontpageComponent } from './frontpage/frontpage.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';
import { UploadComponent } from './upload/upload.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { EventCreatedComponent } from './event-created/event-created.component';

const routes:Routes = [
  { path: '', component:FrontpageComponent },
  //lag en default, for routen uten eventpin
  { path: 'event', component:EventComponent },
  { path: 'events/:eventPin', component:EventComponent },
  { path: 'createEvent', component:CreateEventComponent },
  { path: 'about', component:AboutComponent },
  { path: 'contact', component:ContactComponent },
  //her også
  { path: 'eventCreated/:eventPin', component:EventCreatedComponent},
  { path: 'upload/:eventPin', component:UploadComponent },
  { path: 'upload', component:UploadComponent },
  { path:'**', component:PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DownloadComponent,
    MainContentComponent,
    EventComponent,
    CreateEventComponent,
    FrontpageComponent,
    ContactComponent,
    AboutComponent,
    UploadComponent,
    PageNotFoundComponent,
    EventCreatedComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
