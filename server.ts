import express from "express";
import { getEnv, logCatchedException } from "./src/framework/functions";
import { App } from "./src/framework/app";
import { Boostrap } from "./src/bootstrap";
import { CacheFacade } from "./src/framework/cache";

const app = new App(express(), {port: getEnv("APP_REST_SERVER_PORT")}, new Boostrap());


app.boot()
    .then()
    .catch(logCatchedException)
;

CacheFacade.set("deivi", "pena").then((value: any) => {
    console.log("1 SET - UNDEFINED", value);
});

CacheFacade.has("deivi").then((value: boolean) => {
    console.log("2 HAS - TRUE", value);
});
CacheFacade.get("deivi").then((value: any) => {
    console.log("3 GET - PENA", value);
});
CacheFacade.unset("deivi").then((value: any) => {
    console.log("4 UNSET - UNDEFINED", value);
});
CacheFacade.has("deivi").then((value: boolean) => {
    console.log("5 HAS - FALSE",value);
});
CacheFacade.get("deivi").then((value: any) => {
    console.log("6 GET - NULL", value);
});
CacheFacade.get("deivi", "pena").then((value: any) => {
    console.log("7 GET - PENA", value);
});