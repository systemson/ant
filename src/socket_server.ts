import net from "net";
import { ServiceProviderContract } from "./bootstrap";
import { getEnv } from "./framework/functions";
import { Lang } from "./framework/lang";
import { Logger } from "./framework/logger";

export default class SockerServer implements ServiceProviderContract {

    public boot(): void {

        /**
		 * Servidor de Socket
		 */
        const appSocketPort = getEnv("APP_SOCKET_PORT", "3000");

        Logger.info(Lang.__("Servidor Socket de {{name}} iniciado en el puerto {{port}}.", {
            name: getEnv("APP_NAME"),
            port: appSocketPort,
        }));

        const server = net.createServer((socket) => {
            Logger.debug(Lang.__("El cliente de {{clientName}} se ha conectado al servidor de Socket desde {{remoteAddress}}:{{remotePort}}.", {
                clientName: "Cliente",
                remoteAddress: socket.remoteAddress as string,
                remotePort: (socket.remotePort as number).toString(),
            }));

            socket.on("data",  async (buffer) => {
                const message = buffer.toString("utf-8");
                Logger.debug(message);
            });
		
            socket.on("end", () => {
                Logger.debug(Lang.__("El cliente de {{clientName}} se ha desconectado del servidor de Socket.", {
                    clientName: "Cliente",
                }));
            });

            socket.on("error", () => {
                Logger.error(Lang.__("Ha ocurrido un error con el cliente de Socket}}"));
            });
        });

        server.listen(appSocketPort);
    }
}
