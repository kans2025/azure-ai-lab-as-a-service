import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { User, Subscription } from "../shared/models";

const usersContainer = containers.users;
const subsContainer = containers.subscriptions;

export async function meHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  // Try to find existing user
  const { resources: users } = await usersContainer.items
    .query<User>({
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: auth.userId }]
    })
    .fetchAll();

  let user: User | undefined = users[0];

  if (!user) {
    const newUser: User = {
      id: auth.userId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      email: auth.email ?? "",
      displayName: auth.name ?? "",
      roles: auth.roles.length ? auth.roles : ["Student"],
      status: "Active",
      createdAt: new Date().toISOString()
    };

    const createResult = await usersContainer.items.create(newUser);
    user = createResult.resource as User | undefined;
  }

  if (!user) {
    // Extremely unlikely, but keeps TS happy and you get a clear runtime log if something’s wrong
    context.error("Failed to load or create user document in Cosmos DB");
    return {
      status: 500,
      jsonBody: { error: "Failed to load user profile" }
    };
  }

  const { resources: subs } = await subsContainer.items
    .query<Subscription>({
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId",
      parameters: [
        { name: "@tenantId", value: auth.tenantId },
        { name: "@userId", value: auth.userId }
      ]
    })
    .fetchAll();

  return {
    status: 200,
    jsonBody: {
      userId: user.userId,
      tenantId: user.tenantId,
      displayName: user.displayName,
      roles: user.roles,
      subscriptions: subs
    }
  };
}

app.http("me", {
  methods: ["GET"],
  route: "me",
  authLevel: "anonymous", // protected via App Service / SWA auth
  handler: meHandler
});

