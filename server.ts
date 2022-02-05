import "reflect-metadata";
import { App, logCatchedException } from "@ant/framework";
import { Boostrap } from "./src/bootstrap";
import { cwd } from "process";
import { isTypescript } from "@ant/framework/lib/src/helpers";

console.log(isTypescript());
console.log(cwd());



(new App(new Boostrap()))
    .boot()
    .catch(logCatchedException)
;

