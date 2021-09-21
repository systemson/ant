import { BaseRoute, Method, response, Response } from "../framework/router";
import { now } from "../framework/helpers";
import { CacheFacade } from "../framework/cache";
import cheerio, { CheerioAPI } from 'cheerio';
import axios from "axios";

export class TasaBCVRoute extends BaseRoute {
    url = "/api/v1/tasas/bcv";

    method: Method = "get";

    handle(): Promise<Response> {
        return new Promise((resolve) => {
            CacheFacade.call(
                "divisa_bcv",
                new Promise((resolve) => {
                    const body = axios.get("http://www.bcv.org.ve").then(body => {
                        const $ = cheerio.load(body.data);

                        const data = {
                            divisas: {
                                euro: this.parsearDivisa($, "euro"),
                                dolar: this.parsearDivisa($, "dolar"),
                                yuan: this.parsearDivisa($, "yuan"),
                                rublo: this.parsearDivisa($, "rublo"),
                            },
                            actualizado_en: now().toString(),
                        }

                        resolve(JSON.stringify(data));
                    });
                }),
                1000 * 60 * 5
            )
            .then((data) => {             
                resolve(response(JSON.parse(data)));
            });
        })
    }

    protected parsearDivisa($: CheerioAPI, nombre: string): number {
        return parseFloat($(`#${nombre}`).children().first().children().last().children().last().text().trim().split(".").join("").replace(",", "."))
    }
}
