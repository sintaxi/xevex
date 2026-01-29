import { BaseConvexClient } from "convex/browser";

export function createBaseConvexSlice() {

  // Subscription manager outside the store
  const subscriptions = new Map();
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
          [queryToken]: client.localQueryResult(sub.name, sub.args),
        };
      }

      set({ queries: nextQueries });
    };

    return {
      queries: {},

      connect(convexUrl) {
        if (client) {
          throw new Error('Already connected to Convex');
        }
        client = new BaseConvexClient(convexUrl, onTransition);
      },

      subscribe: function(name, args = {}, placeholder = null) {
        if (!client) {
          throw new Error('Not connected. Call connect(convexUrl) first');
        }

        const key = `${name}:${JSON.stringify(args || {})}`;
        const state = get();

        // Check if subscription already exists
        for (const [queryToken, sub] of subscriptions) {
          if (sub.key === key) {
            return state.queries[queryToken] || placeholder;
          }
        }

        // Create new subscription without mutating store
        const { queryToken, unsubscribe } = client.subscribe(name, args);
        subscriptions.set(queryToken, { name, args, key, unsubscribe });

        return state.queries[queryToken] || placeholder;
      },

      async mutation(name, args = {}) {
        if (!client) {
          throw new Error('Not connected. Call connect(convexUrl) first');
        }
        await client.mutation(name, args);
      },

      getClient() {
        if (!client) {
          throw new Error('Not connected. Call connect(convexUrl) first');
        }
        return client;
      }
    };
  };
}