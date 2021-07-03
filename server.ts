import { logCatchedException } from "./src/framework/helpers";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";
import "reflect-metadata";

const app = new App(new Boostrap());

app.boot().catch(logCatchedException);
