# WebArcade

A personal library for organizing your favorite browser games in one place.

WebArcade gives you a clean, customizable interface to keep track of browser games, organize them into collections, mark favorites, and store useful links and images for each game. You can add games using a website URL or upload a standalone HTML file directly into your library.

## Features

- **Personal game library** — add, edit, and delete browser games.
- **Flexible game sources** — add games using a website URL or upload an HTML file.
- **Game details** — save a game title, description, tags, cover image, and screenshots.
- **Uploaded HTML games** — store HTML game files directly in your library and launch them from WebArcade.
- **Collections** — create collections to organize your games.
- **Favorites** — mark games you want to find quickly.
- **Recently played** — keep track of games you've recently opened.
- **Search, filter, and sort** — find games by searching your library, filtering by collection, or sorting by name, recently added, or recently played.
- **Grid and list views** — choose the layout that suits you.
- **Light and dark themes** — switch appearance modes.
- **Custom accent color** — choose a preset color or enter a custom HEX color.
- **Library backup** — export your library as JSON and import it later, with options to merge or replace existing data.
- **HTML file backup** — uploaded HTML game contents are included in library exports, allowing them to be restored through backup imports.
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
2. Enter a game title.
3. Choose the game source:
   - **Website URL** — enter the game's website address.
   - **Uploaded HTML file** — select a standalone `.html` file from your device.
4. Optionally add a description, tags, collection, cover image, screenshots, and favorite status.
5. Save the game to add it to your library.
6. Use the sidebar to switch between all games, favorites, recently played, and your collections.
7. Open **Settings & backup** to change the appearance, customize the accent color, or export/import a backup.

### Uploaded HTML Games

WebArcade supports uploading standalone HTML games directly into your library.

- HTML game contents are stored in your browser's IndexedDB database.
- There is no application-imposed HTML file size limit.
- Uploaded HTML games are launched in a sandboxed frame.
- HTML game contents are included when exporting a library backup.
- Importing a backup restores the uploaded HTML game contents along with the rest of your library.
- If an HTML game depends on external images, scripts, or other assets, those resources must remain accessible to the game.

**Note:** Although WebArcade does not impose a hardcoded HTML file size limit, actual storage capacity depends on your browser and available device storage. Large HTML files also increase the size of library backups.

## Data and Backups

WebArcade stores library data in the browser you're using. This means:

- Your library is **not automatically synced** between browsers or devices.
- Hosting the app on GitHub Pages does **not** create a shared library for visitors.
- Clearing browser data may remove your saved library.
- Use **Export library backup** to download a JSON backup, and keep that file somewhere safe.
- Use **Import library backup** to restore or merge saved data on another browser or device.
- Uploaded HTML game contents are included in JSON backups, so they can be transferred along with your library.

Cover images, screenshots, and uploaded HTML files use browser storage too, so large files may run into browser storage limits. Keep backups somewhere safe and export your library regularly.

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
- IndexedDB
- Local Storage
