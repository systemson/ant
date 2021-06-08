import express from "express";
import { getEnv, logCatchedError } from "./src/framework/functions";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";
import { CacheFacade } from "./src/framework/cache";

const app = new App(express(), {port: getEnv("APP_REST_SERVER_PORT")}, new Boostrap());

app.boot()
    .then(() => {})
    .catch(logCatchedError)
;
