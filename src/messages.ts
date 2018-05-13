import * as xml2js from "xml2js";

export const ncNS = "urn:ietf:params:xml:ns:netconf:base:1.0";
export const yangNS = "urn:ietf:params:xml:ns:yang:1";
export const withDefaultsNS =
  "urn:ietf:params:xml:ns:yang:ietf-netconf-with-defaults";

const builderOptions: xml2js.OptionsV2 = {
  renderOpts: {
    pretty: false
  }
};

export function hello(capabilities: string[]) {
  const xmlBuilder = new xml2js.Builder(builderOptions);

  const xml = xmlBuilder.buildObject({
    hello: {
      $: {
        xmlns: ncNS
      },
      capabilities: ["urn:ietf:params:netconf:base:1.1", ...capabilities].map(
        capability => ({ capability })
      )
    }
  });

  return `${xml}\n]]>]]>`;
}

export function rpc(messageId: string, message: any) {
  const xmlBuilder = new xml2js.Builder(builderOptions);
  const xml = xmlBuilder.buildObject({
    rpc: {
      $: {
        "message-id": messageId,
        xmlns: ncNS
      },
      ...message
    }
  });

  return `\n#${xml.length}\n${xml}\n##\n`;
}

export function subscription(notifications: string[]) {
  const filter: any = {
    $: {
      type: "subtree"
    }
  };

  for (const n of notifications) {
    filter[n] = {
      $: {
        xmlns: "urn:ietf:params:xml:ns:yang:ietf-netconf-notifications"
      }
    };
  }

  return {
    "create-subscription": {
      $: {
        xmlns: "urn:ietf:params:xml:ns:netconf:notification:1.0"
      },
      filter
    }
  };
}
