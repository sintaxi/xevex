// lib/createBaseConvexSlice.js
import { BaseConvexClient } from "convex/browser";
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
        client = new BaseConvexClient(convexUrl, onTransition);
      },
      subscribe: function(name, args = {}, placeholder = null) {
        if (!client) {
          throw new Error("Not connected. Call connect(convexUrl) first");
        }
        const key = `${name}:${JSON.stringify(args || {})}`;
        const state = get();
        for (const [queryToken2, sub] of subscriptions) {
          if (sub.key === key) {
            return state.queries[queryToken2] || placeholder;
          }
        }
        const { queryToken, unsubscribe } = client.subscribe(name, args);
        subscriptions.set(queryToken, { name, args, key, unsubscribe });
        return state.queries[queryToken] || placeholder;
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
import { create as zustandCreate } from "zustand";
function create(initializer) {
  const convexSlice = createBaseConvexSlice();
  const useStore = zustandCreate((set, get) => {
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
export {
  create_default as create,
  createBaseConvexSlice,
  create_default as default
};
//# sourceMappingURL=index.js.map
