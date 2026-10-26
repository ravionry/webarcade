# WebArcade

A personal library for organizing your favorite browser games in one place.

WebArcade gives you a clean, customizable interface to keep track of browser games, organize them into collections, mark favorites, and store useful links and images for each game.

## Features

- **Personal game library** — add, edit, and delete browser games.
- **Game details** — save a game URL, description, tags, cover image, and screenshots.
- **Collections** — create collections to organize your games.
- **Favorites** — mark games you want to find quickly.
- **Recently played** — keep track of games you've recently opened.
- **Search, filter, and sort** — find games by searching your library, filtering by collection, or sorting by name, recently added, or recently played.
- **Grid and list views** — choose the layout that suits you.
- **Light and dark themes** — switch appearance modes.
- **Custom accent color** — choose a preset color or enter a custom HEX color.
- **Library backup** — export your library as JSON and import it later, with options to merge or replace existing data.
- **Responsive layout** — use WebArcade on desktop or mobile.
- **Local-first storage** — your library is saved in your browser rather than shared through the website.

## Getting Started

### Run locally

1. Download or clone this repository.
2. Keep the project folders and files in their existing structure.
3. Open `index.html` in a modern web browser.

The main page loads its stylesheet from `css/style.css` and its JavaScript from `js/app.js`. The favicon is loaded from `assets/icons/favicon.svg`, so keep that file at the expected path.

### Use the app

1. Select **Add game**.
2. Enter a title and game URL. Description, tags, collection, cover image, screenshots, and favorite status are optional.
3. Save the game to add it to your library.
4. Use the sidebar to switch between all games, favorites, recently played, and your collections.
5. Open **Settings & backup** to change the appearance, customize the accent color, or export/import a backup.

## Data and Backups

WebArcade stores library data in the browser you're using. This means:

- Your library is **not automatically synced** between browsers or devices.
- Hosting the app on GitHub Pages does **not** create a shared library for visitors.
- Clearing browser data may remove your saved library.
- Use **Export library backup** to download a JSON backup, and keep that file somewhere safe.
- Use **Import library backup** to restore or merge saved data on another browser or device.

Cover images and screenshots use browser storage too, so large images may run into browser storage limits. Keep image files reasonably small and export backups regularly.

## Project Structure

```text
.
├── assets/
│   └── icons/
│       └── favicon.svg
├── css/
│   └── style.css
├── js/
│   └── app.js
├── index.html
└── README.md
```

## Built With

- HTML
- CSS
- JavaScript

## Credits

Created by [ravionry](https://github.com/ravionry).
