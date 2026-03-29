// Tells Convex how to validate JWTs issued by Clerk.
// The domain is the Clerk Frontend API URL for this project.
// Convex fetches {domain}/.well-known/openid-configuration to discover keys.
export default {
  providers: [
    {
      domain: "https://busy-llama-50.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
