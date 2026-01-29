var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.js
var index_exports = {};
__export(index_exports, {
  create: () => create_default,
  createBaseConvexSlice: () => createBaseConvexSlice,
  default: () => create_default
});
module.exports = __toCommonJS(index_exports);

// lib/createBaseConvexSlice.js
var import_browser = require("convex/browser");
function createBaseConvexSlice() {
  const subscriptions = /* @__PURE__ */ new Map();
  let client = null;
  return (set, get) => {
    const onTransition = function(updatedQueryTokens) {
      const state = get();
      const { queries } = state;
      let nextQueries = queries;
      for (const queryToken of updatedQueryTokens) {
        const sub = subscriptions.get(queryToken);
        if (!sub) continue;
        nextQueries = {
          ...nextQueries,
          [queryToken]: client.localQueryResult(sub.name, sub.args)
        };
      }
      set({ queries: nextQueries });
    };
    return {
      queries: {},
      connect(convexUrl) {
        if (client) {
          throw new Error("Already connected to Convex");
        }
        client = new import_browser.BaseConvexClient(convexUrl, onTransition);
      },
      subscribe: function(name, args = {}, placeholder = null) {
        if (!client) {
          throw new Error("Not connected. Call connect(convexUrl) first");
        }
        const key = `${name}:${JSON.stringify(args || {})}`;
        for (const [queryToken2, sub] of subscriptions) {
          if (sub.key === key) {
            return (state) => state.queries[queryToken2] || placeholder;
          }
        }
        const { queryToken, unsubscribe } = client.subscribe(name, args);
        subscriptions.set(queryToken, { name, args, key, unsubscribe });
        return (state) => state.queries[queryToken] || placeholder;
      },
      async mutation(name, args = {}) {
        if (!client) {
          throw new Error("Not connected. Call connect(convexUrl) first");
        }
        await client.mutation(name, args);
      },
      getClient() {
        if (!client) {
          throw new Error("Not connected. Call connect(convexUrl) first");
        }
        return client;
      }
    };
  };
}

// lib/create.js
var import_zustand = require("zustand");
function create(initializer) {
  const convexSlice = createBaseConvexSlice();
  const useStore = (0, import_zustand.create)((set, get) => {
    const convexState = convexSlice(set, get);
    const userState = typeof initializer === "function" ? initializer(set, get) : initializer || {};
    return {
      ...userState,
      ...convexState
      // Convex methods take precedence to prevent user override
    };
  });
  useStore.connect = function(convexUrl) {
    const state = useStore.getState();
    state.connect(convexUrl);
    return useStore;
  };
  return useStore;
}
var create_default = create;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create,
  createBaseConvexSlice
});
//# sourceMappingURL=index.js.map
