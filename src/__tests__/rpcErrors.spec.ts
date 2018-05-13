import { expect } from "chai";

import RPCError from "../rpcError";
import RPCErrors from "../rpcErrors";

describe("RPC Errors", () => {
  const errorObj = {
    "error-info": [
      {
        "bad-element": ["tenant"]
      }
    ],
    "error-message": ["element tenant missing required element security"],
    "error-path": [
      '/t128:config/authy:authority/authy:tenant[authy:name="foo"]'
    ],
    "error-severity": ["error"],
    "error-tag": ["missing-element"],
    "error-type": ["application"]
  };

  it("should construct an RPCErrors with multiple errors", () => {
    const errors = [new RPCError(errorObj), new RPCError(errorObj)];
    const err = new RPCErrors(errors);

    expect(err.message).to.equal(
      "Multiple errors: element tenant missing required element security, element tenant missing required element security."
    );
    expect(err.errors).to.equal(errors);
  });

  it("should construct an RPCErrors with a single error", () => {
    const errors = [new RPCError(errorObj)];
    const err = new RPCErrors(errors);

    expect(err.message).to.equal(
      "element tenant missing required element security"
    );
    expect(err.errors).to.equal(errors);
  });
});
