import express from "express";
import { Lang } from "./src/framework/lang";
import { Logger } from "./src/framework/logger";
import { getEnv } from "./src/framework/functions";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";

Logger.info(Lang.__("Starting [{{name}}] microservice", { name: getEnv("APP_NAME") }));

const app = new App(express(), {port: getEnv("APP_REST_SERVER_PORT")}, new Boostrap());

app.boot();
