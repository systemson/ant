import "reflect-metadata";
import { logCatchedException } from "./src/framework/helpers";
import { app } from "./src/framework/app";

app.boot().catch(logCatchedException);
