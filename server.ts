import express from "express";
import { Lang } from "./src/framework/lang";
import { Logger } from "./src/framework/logger";
import { getEnv } from "./src/framework/functions";
import { App } from "./src/framework/app";

Logger.info(Lang.__("Starting [{{name}}] microservice", { name: getEnv("APP_NAME") }));

const app = new App(express(), {
    port: getEnv("APP_PORT")
});

app.boot();
