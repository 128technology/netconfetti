import { expect } from "chai";

import RPCError from "../rpcError";

describe("RPC Error", () => {
  it("should construct an RPCError", () => {
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
    const err = new RPCError(errorObj);

    expect(err.message).to.equal(
      "element tenant missing required element security"
    );
    expect(err.type).to.equal("application");
    expect(err.tag).to.equal("missing-element");
    expect(err.severity).to.equal("error");
    expect(err.originalError).to.equal(errorObj);
  });

  it("should construct an empty RPCError with missing fields", () => {
    const errorObj = {};
    const err = new RPCError(errorObj);

    expect(err.message).to.equal("RPC Error");
    expect(err.type).to.equal(undefined);
    expect(err.tag).to.equal(undefined);
    expect(err.severity).to.equal(undefined);
    expect(err.originalError).to.equal(errorObj);
  });
});
