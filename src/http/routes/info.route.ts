import {
    BaseRoute,
    Method,
    Request,
    response,
    Response
} from "@ant/framework";
import {
    getEnv,
    Lang
} from "@ant/framework";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "post";

    handle(req: Request): Response {
        const body = req.body;

        console.log(body);
        console.log(JSON.stringify(body));
        console.log(body.tatara_abuelo);
        console.log(body.tatara_abuelo.bisabuelo);
        console.log(body.tatara_abuelo.bisabuelo.abuelo);
        console.log(body.tatara_abuelo.bisabuelo.abuelo.padre);
        console.log(body.tatara_abuelo.bisabuelo.abuelo.padre.hijo);
        console.log(body.tatara_abuelo.bisabuelo.abuelo.padre.hijo.nieto);

        return response({
            status: Lang.__("active"),
            message:  Lang.__("The [{{name}}] microservice is up and running.", {
                name: getEnv("APP_NAME", "Ant"),
            }),
        });
    } 
}
