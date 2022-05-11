import { App, logCatchedException } from "@ant/framework";
import "reflect-metadata";
import { Boostrap } from "./src/bootstrap";

(new App(new Boostrap()))
    .boot()
    .catch(logCatchedException)
;
