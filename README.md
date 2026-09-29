# Artistic

A social app for artists: post finished work and works in progress, follow other artists, ask for feedback, and talk shop in direct messages.

It's a static web app (HTML, CSS and JavaScript modules) with no build step and no dependencies, so it runs on any static host.

## Features

- **Home feed** with *For you* (ranked by recency and engagement) and *Following* (newest first) tabs, stories, and a quick composer.
- **Posts** with the artwork, caption with `#tags` and `@mentions`, medium and time spent, and the piece's color palette (tap a swatch to copy its hex code). Like, comment, repost, copy link and save. Double-tap an image to like it; tap once to open the full-screen viewer.
- **Feedback requests**: posts can carry a *Feedback wanted* label, and the comment box reminds people to be specific and kind.
- **Explore** with search across artists, tags and mediums, category filters, an *Artists to know* strip and a masonry grid of popular work. Tag pages at `#/tag/<name>`.
- **Profiles** with cover art, bio, location, website, *Open for commissions* badge, follower counts, and Posts, Likes and Saved tabs. Edit your profile and upload a photo.
- **Stories** with a full-screen viewer: tap to advance, hold to pause, and reply straight into messages.
- **Notifications** for likes, comments, mentions, follows and reposts, grouped into New and Earlier.
- **Messages**: conversation list and threads, with typing indicators and replies from the sample artists.
- **Create post**: upload an image (it's downscaled in the browser and its palette extracted) or generate a sample piece. Optionally ask for feedback or add it to your story.
- **Weekly challenge** and trending tags in the sidebar.
- **Light and dark themes** (follows the system by default; switch in Settings).
- **Responsive layout**: three columns on desktop, a compact icon rail on tablets, and a top bar plus bottom tab bar on phones.
- Keyboard and screen-reader friendly: focus states, labelled controls, skip link, and reduced-motion support.

## Run it locally

Browsers don't load JavaScript modules from `file://`, so serve the folder with any static server:

```sh
python3 -m http.server 8080
# or: npx serve .
```

Then open http://localhost:8080.

## Deploy

Upload the repository as-is to any static host: GitHub Pages, Netlify, Cloudflare Pages or Vercel. There's no build command, and the publish directory is the repository root.

To serve it at `artistic.dpdns.org`:

- **GitHub Pages**: enable Pages for this branch in the repository settings, set the custom domain to `artistic.dpdns.org` (GitHub adds a `CNAME` file), then point a `CNAME` DNS record for `artistic` at `<your-username>.github.io`.
- **Netlify / Cloudflare Pages**: add `artistic.dpdns.org` as a custom domain in the site settings and create the DNS record they show you.

Routing uses the URL hash (`#/explore`, `#/u/mirapaints`, `#/p/<id>`), so no server rewrites are needed.

## How data works today

Everything is stored in the browser's `localStorage`: accounts, posts, comments, follows and messages. The app starts with a sample community of twelve artists so it never opens empty. Signing up creates a local profile on that device, and **Settings → Reset the sample community** clears it.

That makes it a fully working front end, but posts aren't shared between people or devices yet. To make it a real multi-user network, connect a backend.

## Connecting a backend

All reads and writes go through [`js/store.js`](js/store.js); no other file touches storage. To move to Supabase, Firebase, PocketBase or your own API, reimplement that module's exported functions against the backend and keep their names and return shapes:

| Area | Functions |
| --- | --- |
| Session | `signUp`, `useDemo`, `logout`, `me`, `meId`, `handleTaken` |
| People | `user`, `userByHandle`, `toggleFollow`, `isFollowing`, `followsMe`, `followerCount`, `followingCount`, `suggestedUsers`, `allArtists`, `updateProfile` |
| Posts | `feed`, `post`, `postsBy`, `likedPosts`, `savedPosts`, `popularPosts`, `postsByTag`, `addPost`, `deletePost`, `toggleLike`, `toggleSave`, `toggleRepost` |
| Comments | `comments`, `addComment`, `toggleCommentLike` |
| Notifications | `notifications`, `unreadNotifications`, `markNotificationsRead` |
| Messages | `conversations`, `conversation`, `startConversation`, `sendMessage`, `markConversationRead` |
| Discovery | `search`, `trendingTags`, `tagCount`, `storyGroups` |

The store emits events through `subscribe()` (`engagement`, `message`, `typing`, `session`, `profile`), which is where realtime updates from a backend would plug in. Uploaded images are currently data URLs; with a backend, upload the file to storage and keep the returned URL in `image.src`.

## Project structure

```
index.html            App shell and font loading
css/styles.css        Design tokens (light and dark), layout and components
js/app.js             Boot, rendering and global event wiring
js/router.js          Hash router with its own back stack
js/store.js           Data layer: the only module that reads or writes data
js/seed.js            The sample community
js/art.js             Generative artwork for sample posts, covers and avatars
js/imaging.js         Upload downscaling and palette extraction
js/components.js      Post card, avatars, grids and other shared pieces
js/shell.js           Navigation, mobile bars and the discovery sidebar
js/actions.js         Handlers for every [data-action] button
js/create.js          New post dialog
js/stories.js         Story viewer
js/post-ui.js         Full-screen viewer and post options
js/views/             One module per page
```

## Design

- **Color** is named after artists' pigments: ultramarine `#3B34E0` is the accent, and ultramarine, quinacridone rose `#E0307A` and cadmium yellow `#FFB81C` make up the story ring and logo gradient. Neutrals are cool gallery greys.
- **Type** uses [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) for page titles, profile names and the wordmark, [Figtree](https://fonts.google.com/specimen/Figtree) for the interface, and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for hex codes.
