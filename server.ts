import express from "express";
import { getEnv } from "./src/framework/functions";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";

const app = new App(express(), {port: getEnv("APP_REST_SERVER_PORT")}, new Boostrap());

app.boot();
