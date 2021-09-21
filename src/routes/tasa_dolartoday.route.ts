import { BaseRoute, Method, response, Response } from "../framework/router";
import { now } from "../framework/helpers";
import { CacheFacade } from "../framework/cache";
import cheerio, { CheerioAPI } from 'cheerio';
import axios from "axios";

export class TasaDolaTodayRoute extends BaseRoute {
    url = "/api/v1/tasas/dolartoday";

    method: Method = "get";

    handle(): Promise<Response> {
        return new Promise((resolve) => {
            CacheFacade.call(
                "divisa_dolartoday",
                new Promise((resolve) => {
                    const body = axios.get("https://s3.amazonaws.com/dolartoday/data.json").then(body => {
                        const json = body.data;

                        const data = {
                            divisas: {
                                euro: json.EUR.dolartoday,
                                dolar: json.USD.dolartoday,
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
}
