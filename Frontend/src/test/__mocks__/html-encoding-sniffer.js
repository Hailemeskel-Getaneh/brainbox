// Frontend/src/test/__mocks__/html-encoding-sniffer.js
// This is a mock for html-encoding-sniffer to resolve ERR_REQUIRE_ESM in Vitest.

// html-encoding-sniffer exports a function that takes a Uint8Array and returns a string encoding.
// For testing purposes, we can return a default encoding or null.
export default function htmlEncodingSnifferMock(input) {
  // console.log('htmlEncodingSnifferMock called with:', input);
  return 'utf8';
}
