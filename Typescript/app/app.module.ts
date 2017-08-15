import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {VTScoreComponent} from "../components/score.component";
import {VTSelectComponent} from "../components/select.component";
import {FormsModule} from "@angular/forms";
import {VTLearnComponent} from "../components/learn.component";

@NgModule({
  declarations: [
    AppComponent, VTScoreComponent, VTSelectComponent, VTLearnComponent
  ],
  imports: [
    BrowserModule, FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
