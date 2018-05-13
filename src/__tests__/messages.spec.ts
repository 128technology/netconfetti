import { expect } from "chai";

import * as messages from "../messages";

describe("Messages", () => {
  it("forms a welcome message", () => {
    expect(messages.hello(["test"])).to.equal(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello xmlns="urn:ietf:params:xml:ns:netconf:base:1.0"><capabilities><capability>urn:ietf:params:netconf:base:1.1</capability></capabilities><capabilities><capability>test</capability></capabilities></hello>\n]]>]]>`
    );
  });

  it("forms a RPC message", () => {
    expect(
      messages.rpc("123", {
        commit: {}
      })
    ).to.equal(
      `\n#140\n<?xml version="1.0" encoding="UTF-8" standalone="yes"?><rpc message-id="123" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0"><commit/></rpc>\n##\n`
    );
  });

  it("forms a subscription message", () => {
    expect(messages.subscription(["commit-event"])).to.deep.equal({
      "create-subscription": {
        $: {
          xmlns: "urn:ietf:params:xml:ns:netconf:notification:1.0"
        },
        filter: {
          $: {
            type: "subtree"
          },
          "commit-event": {
            $: {
              xmlns: "urn:ietf:params:xml:ns:yang:ietf-netconf-notifications"
            }
          }
        }
      }
    });
  });
});
