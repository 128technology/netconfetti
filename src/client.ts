import * as events from "events";
import * as ssh2 from "ssh2";
import * as uuid from "uuid";
import * as xml2js from "xml2js";

import * as framing from "./deliminators";
import * as messages from "./messages";
import Notification from "./notification";
import Reply from "./reply";
import RPCErrors from "./rpcErrors";

export interface IClientOptions {
  idGenerator?: () => string;
  timeout?: number;
  capabilities?: string[];
}

export type ClientConnectionOptions = ssh2.ConnectConfig & {
  connectTimeout?: number;
};

export interface IClientEvents {
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "close", listener: (hadError: boolean) => void): this;
  on(event: "reply", listener: (error: Reply) => void): this;
  on(event: "notification", listener: (error: Notification) => void): this;
}

export default class Client extends events.EventEmitter
  implements IClientEvents {
  private readonly parser: xml2js.Parser;
  private readonly sshClient: ssh2.Client = new ssh2.Client();
  private readonly capabilities: string[];
  private activeChannel?: ssh2.Channel;
  private readonly idGenerator: () => string;
  private readonly timeout: number;
  private receiveBuffer: string = "";

  constructor(options: IClientOptions = {}) {
    super();

    this.idGenerator = options.idGenerator || (() => uuid.v1());
    this.timeout = options.timeout || 1000 * 60;
    this.capabilities = options.capabilities || [];
    this.parser = new xml2js.Parser({
      attrNameProcessors: [xml2js.processors.stripPrefix],
      tagNameProcessors: [xml2js.processors.stripPrefix]
    });
  }

  public connect(options: ClientConnectionOptions): Promise<Client> {
    this.disconnect();

    const connectTimeout = options.connectTimeout || 20000;

    const connect = new Promise<ssh2.ClientChannel>((resolve, reject) => {
      this.sshClient.once("error", reject);
      this.sshClient.once("ready", resolve);
      this.sshClient.connect(options);
    })
      .then(
        () =>
          new Promise<ssh2.ClientChannel>((resolve, reject) => {
            this.sshClient.subsys(
              "netconf",
              (err, chan) => (err ? reject(err) : resolve(chan))
            );
          })
      )
      .then(
        channel =>
          new Promise<ssh2.ClientChannel>(resolve => {
            let buffer = "";

            channel.on("data", (data: Buffer) => {
              buffer += data.toString();
              if (framing.endHello.test(buffer)) {
                resolve(channel);
              }
            });

            channel.write(messages.hello(this.capabilities));
          })
      )
      .then(channel => {
        channel.removeAllListeners();
        this.sshClient.removeAllListeners();

        this.activeChannel = channel;

        this.sshClient.on("error", err => this.emit("error", err));
        this.sshClient.on("end", () => this.disconnect());
        this.sshClient.on("close", hadError => this.emit("close", hadError));
        channel.on("data", (data: Buffer) => this.processData(data));
      });

    let timeoutTimer: NodeJS.Timer;
    const timeout = new Promise((resolve, reject) => {
      timeoutTimer = setTimeout(
        () =>
          reject(new Error("Timeout waiting for NetConf client to connect.")),
        connectTimeout
      );
    });

    return Promise.race([connect, timeout])
      .catch(err => {
        this.disconnect();
        clearTimeout(timeoutTimer);
        return Promise.reject(err);
      })
      .then(() => {
        clearTimeout(timeoutTimer);
        return this;
      });
  }

  public disconnect() {
    if (this.activeChannel) {
      this.activeChannel.removeAllListeners();
      this.activeChannel.close();
      this.activeChannel = undefined;
    }

    this.sshClient.removeAllListeners();
    this.sshClient.end();

    this.receiveBuffer = "";
  }

  public rpc(message: string | any): Promise<Reply> {
    return new Promise<Reply>((resolve, reject) => {
      if (!this.activeChannel) {
        throw new Error("Client not connected");
      }

      const messageId = this.idGenerator();

      const msg = messages.rpc(
        messageId,
        typeof message === "string" ? { [message]: {} } : message
      );

      let msgRecv: (recv: any) => void;

      const timeoutId = setTimeout(() => {
        this.removeListener("reply", msgRecv);
        clearTimeout(timeoutId);
        reject(new Error("Timeout waiting for response"));
      }, this.timeout);

      msgRecv = (reply: Reply) => {
        if (reply.messageId !== messageId) {
          return;
        }

        this.removeListener("reply", msgRecv);
        clearTimeout(timeoutId);

        if (reply.errors.length > 0) {
          reject(new RPCErrors(reply.errors));
        } else {
          resolve(reply);
        }
      };

      this.on("reply", msgRecv);

      this.activeChannel.write(msg);
    });
  }

  public subscribe(notifications: string[]) {
    return this.rpc(messages.subscription(notifications));
  }

  private processData(buffer: Buffer) {
    this.receiveBuffer += buffer.toString();

    while (true) {
      const match = framing.beginFrame.exec(this.receiveBuffer);

      if (match === null) {
        break;
      }

      this.receiveBuffer = this.receiveBuffer.substring(match.index);
      const headerLength = match[0].length;
      const bodyLength = parseInt(match[1], 10);
      const messageLength = headerLength + bodyLength;

      if (this.receiveBuffer.length < messageLength) {
        break;
      }

      const data = this.receiveBuffer
        .substring(headerLength, messageLength)
        .trim();

      this.receiveBuffer = this.receiveBuffer.substring(messageLength);
      this.parser.parseString(data, (err: Error, result: any) => {
        if (err) {
          this.emit("error", err);
          return;
        }

        if (!result) {
          this.emit("error", new Error("Parsed response was empty."));
          return;
        }

        const reply = result["rpc-reply"];
        if (reply) {
          this.emit("reply", new Reply(reply, data));
          return;
        }

        const notification = result.notification;
        if (notification) {
          this.emit("notification", new Notification(notification, data));
          return;
        }
      });
    }
  }
}
