# Netconfetti 🎉  [![Build Status](https://travis-ci.org/128technology/netconfetti.svg?branch=master)](https://travis-ci.org/128technology/netconfetti) [![npm (scoped)](https://img.shields.io/npm/v/@128technology/netconfetti.svg)](https://www.npmjs.com/package/@128technology/netconfetti)

_It's always a party with NetConf_

Netconfetti is a Javascript client for the NetConf protocol.

## Example

```javascript
const netconfetti = require('@128technology/netconfetti');

// Beacuse Netconfetti is promise based, it's extremely easy to utilize it
// in a async/await fashion.
async function main() {
  const client = new netconfetti.Client();

  await client.connect({
    host: '127.0.0.1',
    username: 'admin',
    password: 'admin',
    port: 22
  });

  // The RPC method can also take a string
  const configResponse = await client.rpc('get-config');
  console.log(configResponse.data)

  // The RPC method can also take an object that will get converted into
  // XML via xml2js.Builder.
  const doThingsResponse = await client.rpc({
    'do-things': {
      $: {
        xmlns: 'http://special-namespace-here-if-required'
      },
      'param1': 'hello',
      'param2': 'goodbye'
    }
  });

  console.log(doThingsResponse.data);
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  });

```