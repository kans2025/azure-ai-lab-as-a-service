// Ensure all HTTP functions are imported so their app.http(...) registrations run

import "./functions/me";
import "./functions/tiers-get";
import "./functions/subscriptions-get";
import "./functions/subscriptions-create";
import "./functions/environments-get";
import "./functions/environments-get-by-id";
import "./functions/environments-create";
import "./functions/environments-delete";
import "./functions/experiments-get";
import "./functions/experiments-get-by-id";
import "./functions/experiments-run";
import "./functions/usage-credits";
import "./functions/usage-history";

// No exports needed – just side-effects from imports.

