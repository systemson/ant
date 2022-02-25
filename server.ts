import "reflect-metadata";
import { App, logCatchedException } from "@ant/framework";
import { Boostrap } from "./src/bootstrap";

(new App(new Boostrap()))
    .boot()
    .catch(logCatchedException)
;

