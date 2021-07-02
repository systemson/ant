import express from "express";
import { getEnv, logCatchedException } from "./src/framework/helpers";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";
import "reflect-metadata";

const app = new App(express(), {port: getEnv("APP_REST_SERVER_PORT")}, new Boostrap());


app.boot().catch(logCatchedException);
