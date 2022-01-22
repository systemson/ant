import "reflect-metadata";
import { Boostrap } from "./src/bootstrap";
import { App } from "./src/framework/app";
import { logCatchedException } from "./src/framework/helpers";

(new App(new Boostrap()))
    .boot()
    .catch(logCatchedException)
;
