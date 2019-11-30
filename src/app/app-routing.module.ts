import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {EntryModalComponent} from './components/entry-modal/entry-modal.component';
import { ImageMapComponent } from './components/image-map/image-map.component';


const routes: Routes = [
  {path: 'entry-modal', component: EntryModalComponent},
  {path: '', component: ImageMapComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
