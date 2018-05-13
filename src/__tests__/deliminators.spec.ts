import { expect } from "chai";

import {
  beginFrame,
  endFrame,
  endFrameNoCapture,
  endHello
} from "../deliminators";

const mockHelloMessage =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<hello xmlns="urn:ietf:params:xml:ns:netconf:base:1.0"><capabilities>' +
  "<capability>urn:ietf:params:netconf:base:1.1</capability></capabilities></hello>]]>]]>";

const mockResponseXML =
  '\n#718\n<?xml version="1.0" encoding="UTF-8"?>' +
  '\n<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0" message-id="1">' +
  "\n<data>\n<t128:config/>\n</data>\n</rpc-reply>\n##\n";

describe("Deliminators", () => {
  it("match message beginning", () => {
    expect(beginFrame.test(mockResponseXML)).to.equal(true);
  });

  it("match message end", () => {
    expect(endFrameNoCapture.test(mockResponseXML)).to.equal(true);
  });

  it("match message end and capture", () => {
    const messageWithEnd = mockResponseXML.slice(6);
    expect(endFrame.exec(messageWithEnd)![0]).to.equal(
      messageWithEnd.slice(0, -4)
    );
  });

  it("match hello message end", () => {
    expect(endHello.test(mockHelloMessage)).to.equal(true);
  });
});
