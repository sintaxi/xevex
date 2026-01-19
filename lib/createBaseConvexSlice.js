import { BaseConvexClient } from "convex/browser";

export function createBaseConvexSlice(convexUrl) {
  
  // Subscription manager outside the store
  const subscriptions = new Map();

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

    const client = new BaseConvexClient(convexUrl, onTransition);

    return {
      queries: {},

      subscribe: function(name, args = {}, placeholder = null) {
        const key = `${name}:${JSON.stringify(args || {})}`;

        // Check if subscription already exists
        for (const [queryToken, sub] of subscriptions) {
          if (sub.key === key) {
            return (state) => state.queries[queryToken] || placeholder;
          }
        }

        // Create new subscription without mutating store
        const { queryToken, unsubscribe } = client.subscribe(name, args);
        subscriptions.set(queryToken, { name, args, key, unsubscribe });

        return (state) => state.queries[queryToken] || placeholder;
      },

      async mutation(name, args = {}) {
        await client.mutation(name, args);
      },

      getClient() {
        return client;
      }
    };
  };
}