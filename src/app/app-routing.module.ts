import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {EntryModalComponent} from './components/entry-modal/entry-modal.component';


const routes: Routes = [
  {path: 'entry-modal', component: EntryModalComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
