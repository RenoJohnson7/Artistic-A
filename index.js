import { home } from './home.js';
import { explore, tag } from './explore.js';
import { profile } from './profile.js';
import { postView } from './post.js';
import { notificationsView } from './notifications.js';
import { messages } from './messages.js';
import { marketplace } from './marketplace.js';
import { saved, settings, notFound } from './misc.js';

export const VIEWS = {
  home,
  explore,
  marketplace,
  tag,
  profile,
  post: postView,
  notifications: notificationsView,
  messages,
  saved,
  settings,
  notFound,
};
