import RPCError from "./rpcError";

export default class Reply {
  public readonly raw: string;
  public readonly messageId: string;
  public readonly data: any;
  public readonly errors: RPCError[];

  constructor(result: any, raw: string) {
    this.messageId = result.$["message-id"];
    this.data = result.data;
    this.errors = (result["rpc-error"] || []).map(
      (err: any) => new RPCError(err)
    );
    this.raw = raw;
  }
}
