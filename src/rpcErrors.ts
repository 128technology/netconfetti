import RPCError from "./rpcError";

export default class RPCErrors extends Error {
  public readonly errors: RPCError[];

  constructor(errors: RPCError[]) {
    const message =
      errors.length === 1
        ? errors[0].message
        : `Multiple errors: ${errors.map(x => x.message).join(", ")}.`;

    super(message);

    this.errors = errors;
  }
}
