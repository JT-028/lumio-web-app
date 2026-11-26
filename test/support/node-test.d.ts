// Node 24.18 (CI) and 26 take `exports` in mock.module() options and deprecate
// `namedExports`/`defaultExport`. @types/node 22.19 does not declare it yet.
import "node:test";

declare module "node:test" {
  namespace test {
    interface MockModuleOptions {
      /** The mock's exports. A `default` key is the default export; every other key is a named export. */
      exports?: object | undefined;
    }
  }
}
