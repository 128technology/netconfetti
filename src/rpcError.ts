export default class RPCError extends Error {
  public readonly type: string;
  public readonly tag: string;
  public readonly severity: string;
  public readonly originalError: any;

  constructor(error: any) {
    super((error["error-message"] || [])[0] || "RPC Error");
    this.type = (error["error-type"] || [])[0];
    this.tag = (error["error-tag"] || [])[0];
    this.severity = (error["error-severity"] || [])[0];
    this.originalError = error;
  }
}
