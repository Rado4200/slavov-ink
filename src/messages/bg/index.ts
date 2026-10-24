import type { Messages } from "@/messages/en";

import a11y from "./a11y.json";
import about from "./about.json";
import common from "./common.json";
import contact from "./contact.json";
import footer from "./footer.json";
import home from "./home.json";
import nav from "./nav.json";
import notFound from "./notFound.json";
import portfolio from "./portfolio.json";

// `satisfies` fails the typecheck when a key from English is missing here.
const messages = {
  a11y,
  about,
  common,
  contact,
  footer,
  home,
  nav,
  notFound,
  portfolio,
} satisfies Messages;

export default messages;
