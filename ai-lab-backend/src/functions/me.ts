import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { User, Subscription } from "../shared/models";

const usersContainer = containers.users;
const subsContainer = containers.subscriptions;

export async function meHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  // Upsert user record
  const { resources: users } = await usersContainer.items
    .query<User>({
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: auth.userId }]
    })
    .fetchAll();

  let user = users[0];
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
    const res = await usersContainer.items.create(newUser);
    user = res.resource;
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
  authLevel: "anonymous", // Protected by Azure AD at the app level
  handler: meHandler
});

