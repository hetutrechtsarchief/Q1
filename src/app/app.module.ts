import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { ImageMapComponent } from './components/image-map/image-map.component';

@NgModule({
  declarations: [
    AppComponent,
    EntryModalComponent,
    ImageMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
