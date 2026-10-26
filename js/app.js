(() => {
  "use strict";

  const STORAGE_KEY = "webarcade.library.v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const starterLibrary = () => ({
    schemaVersion: 1,
    games: [
      { id: "hordes-io", title: "Hordes.io", url: "https://hordes.io/", description: "A multiplayer browser MMO.", tags: ["MMO", "Multiplayer"], collectionId: "multiplayer", coverData: "", favorite: true, addedAt: new Date().toISOString(), lastPlayedAt: null, playCount: 0 },
      { id: "tetr-io", title: "TETR.IO", url: "https://tetr.io/", description: "A fast-paced competitive block puzzle game.", tags: ["Puzzle", "Competitive"], collectionId: "quick-play", coverData: "", favorite: false, addedAt: new Date().toISOString(), lastPlayedAt: null, playCount: 0 },
      { id: "pokemon-showdown", title: "Pokémon Showdown", url: "https://pokemonshowdown.com/", description: "Build teams and battle in a browser-based Pokémon battle simulator.", tags: ["Strategy", "Battler"], collectionId: "multiplayer", coverData: "", favorite: false, addedAt: new Date().toISOString(), lastPlayedAt: null, playCount: 0 }
    ],
    collections: [
      { id: "multiplayer", name: "Multiplayer" },
      { id: "quick-play", name: "Quick play" }
    ],
    settings: { theme: "light", sort: "added", density: "compact", viewMode: "grid", sidebarCollapsed: false, accentColor: "#165DFF" }
  });

  let library;
  let currentView = "all";
  let currentCollection = "";
  let currentFilter = "all";
  let toastTimer;

  function loadLibrary() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return starterLibrary();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.games) || !Array.isArray(parsed.collections)) throw new Error("Invalid library structure");
      return { schemaVersion: 1, games: parsed.games, collections: parsed.collections, settings: { theme: "light", sort: "added", density: "compact", viewMode: "grid", accentColor: "#165DFF", ...(parsed.settings || {}) } };
    } catch (error) {
      console.error("Could not load library:", error);
      return starterLibrary();
    }
  }

  function saveLibrary() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      $("#storage-status").textContent = "Saved in this browser";
      return true;
    } catch (error) {
      console.error(error);
      $("#storage-status").textContent = "Save failed — export a backup";
      showToast("Could not save. The library may be too large; export a backup.");
      return false;
    }
  }

  function makeId(value) {
    const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "game";
    let id = base, n = 2;
    while (library.games.some(game => game.id === id && game.id !== $("#game-id").value)) id = `${base}-${n++}`;
    return id;
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function initials(title) {
    return title.trim().split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toUpperCase();
  }

  // Offline, title-specific cover art. User-uploaded covers always take precedence.
  function generateCustomCover(title, tags = []) {
    const safeTitle = String(title || "Untitled game").trim().slice(0, 48);
    const words = safeTitle.split(/\s+/);
    const shortTitle = words.length > 3 ? words.slice(0, 3).join(" ") : safeTitle;
    const initialsText = initials(safeTitle) || "WG";
    const palette = ["#165DFF", "#8B5CF6", "#00A896", "#E85D3F", "#D9468F", "#D9A400"];
    let hash = 0; for (const ch of safeTitle) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const accent = palette[hash % palette.length];
    const escaped = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&apos;");
    const tag = (tags || []).slice(0, 2).join(" / ") || "BROWSER GAME";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101114"/><stop offset="1" stop-color="#292c34"/></linearGradient><pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#ffffff" stroke-opacity=".08"/></pattern></defs><rect width="600" height="800" fill="url(#g)"/><rect width="600" height="800" fill="url(#p)"/><circle cx="${110 + hash%360}" cy="${190 + (hash>>3)%260}" r="190" fill="${accent}" opacity=".9"/><circle cx="${450 - hash%180}" cy="${510 + (hash>>5)%100}" r="170" fill="#090a0c" opacity=".78"/><path d="M0 570L600 280V800H0Z" fill="#000" opacity=".35"/><rect x="36" y="36" width="528" height="728" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="2"/><text x="58" y="88" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="800" letter-spacing="5" fill="#fff">WEBARCADE</text><text x="58" y="420" font-family="Arial,Helvetica,sans-serif" font-size="118" font-weight="900" letter-spacing="-8" fill="#fff">${escaped(initialsText.slice(0,4))}</text><text x="58" y="520" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="900" fill="#fff">${escaped(shortTitle)}</text><text x="60" y="562" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="#ddd">${escaped(tag.toUpperCase().slice(0,28))}</text><rect x="58" y="700" width="90" height="8" fill="${accent}"/><text x="542" y="714" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="14" letter-spacing="3" fill="#fff">GAME FILE / ${String(hash%999).padStart(3,"0")}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function currentGames() {
    const query = $("#search").value.trim().toLowerCase();
    let games = [...library.games];
    const collectionFilter = $("#collection-filter")?.value || "";
    if (collectionFilter) games = games.filter(game => game.collectionId === collectionFilter);
    if (currentView === "details") return [];
    if (currentView === "favorites" || currentFilter === "favorites") games = games.filter(game => game.favorite);
    if (currentView === "recent") games = games.filter(game => game.lastPlayedAt).sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt));
    if (currentView === "collection") games = games.filter(game => game.collectionId === currentCollection);
    if (query) games = games.filter(game => [game.title, game.description, ...(game.tags || []), library.collections.find(c => c.id === game.collectionId)?.name || ""].join(" ").toLowerCase().includes(query));
    const sort = $("#sort-select").value;
    if (sort === "title") games.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "added") games.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    if (sort === "recent") games.sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0));
    return games;
  }

  function getAccentInk(hex) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) > 0.42 ? "#171717" : "#FFFFFF";
  }

  function setAccentColor(value) {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      $("#accent-error").textContent = "Enter a valid HEX color, such as #165DFF.";
      return false;
    }
    library.settings.accentColor = value.toUpperCase();
    $("#accent-error").textContent = "";
    saveLibrary();
    render();
    return true;
  }

  function render() {
    renderCollections();
    const theme = library.settings?.theme || "light";
    document.body.dataset.theme = theme;
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(library.settings?.accentColor || "") ? library.settings.accentColor : "#165DFF";
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-ink", getAccentInk(accentColor));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#090a0b" : accentColor);
    $("#theme-select").value = theme;
    $("#density-select").value = library.settings?.density || "compact";
    if ($("#accent-hex")) $("#accent-hex").value = accentColor;
    if ($("#accent-color-picker")) $("#accent-color-picker").value = accentColor.toLowerCase();
    $$(".accent-swatch").forEach(swatch => swatch.setAttribute("aria-pressed", String(swatch.dataset.accent.toUpperCase() === accentColor.toUpperCase())));
    $("#all-count").textContent = library.games.length;
    const sampleButton = $("#reset-demo-button");
    if (sampleButton) {
      const hasGames = library.games.length > 0;
      sampleButton.disabled = hasGames;
      sampleButton.setAttribute("aria-disabled", String(hasGames));
      sampleButton.title = hasGames ? "Restore sample games is available only when your library is empty." : "Restore the starter sample games.";
    }
    const games = currentGames();
    const grid = $("#game-grid"), list = $("#game-list");
    const cardMarkup = game => {
      const cover = game.coverRemoved ? `<div class="cover-placeholder"><strong>NO COVER</strong><small>ARTWORK REMOVED</small></div>` : `<img src="${game.coverData || generateCustomCover(game.title, game.tags)}" alt="${escapeHtml(game.title)} cover">`;
      const tags = (game.tags || []).slice(0, 2).join(" · ") || "Browser game";
      return `<article class="game-card" data-id="${escapeHtml(game.id)}"><button class="cover-button" data-action="details" data-id="${escapeHtml(game.id)}" aria-label="View ${escapeHtml(game.title)} details">${cover}</button><button class="favorite-toggle ${game.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHtml(game.id)}" title="${game.favorite ? "Remove favorite" : "Add favorite"}" aria-label="${game.favorite ? "Remove from favorites" : "Add to favorites"}">${game.favorite ? "★" : "☆"}</button><div class="game-title-row"><button class="game-title" data-action="details" data-id="${escapeHtml(game.id)}">${escapeHtml(game.title)}</button><button class="card-menu" data-action="edit" data-id="${escapeHtml(game.id)}" aria-label="Edit ${escapeHtml(game.title)}">···</button></div><div class="game-meta">${escapeHtml(tags)}</div></article>`;
    };
    grid.innerHTML = games.map(cardMarkup).join("");
    grid.classList.toggle("comfortable", (library.settings?.density || "compact") === "comfortable");
    const mode = library.settings?.viewMode || "grid";
    grid.hidden = games.length === 0 || mode !== "grid";
    list.hidden = games.length === 0 || mode !== "list";
    list.innerHTML = games.map(game => `<article class="list-card" data-action="details" data-id="${escapeHtml(game.id)}" tabindex="0">${game.coverRemoved ? `<div class="list-cover cover-placeholder">—</div>` : `<img class="list-cover" src="${game.coverData || generateCustomCover(game.title, game.tags)}" alt="" onerror="this.style.display='none'">`}<div class="list-info"><div class="list-title">${escapeHtml(game.title)}</div><div class="list-tags">${escapeHtml((game.tags || []).join(" · ") || "Browser game")} · ${escapeHtml(library.collections.find(c=>c.id===game.collectionId)?.name || "Unsorted")}</div></div><div class="list-actions"><button data-action="favorite" data-id="${escapeHtml(game.id)}" aria-label="Toggle favorite">${game.favorite ? "★" : "☆"}</button><button class="edit-action" data-action="edit" data-id="${escapeHtml(game.id)}">Edit</button></div></article>`).join("");
    $("#empty-state").hidden = games.length > 0;
    $("#empty-title").textContent = library.games.length ? "Nothing here. Yet." : "Your next favorite is one click away.";
    $("#empty-copy").textContent = library.games.length ? "Try changing your search or filters, or add a new game." : "Build a personal arcade of the browser games you love.";
    $("#empty-add-button").textContent = library.games.length ? "＋ Add game" : "＋ Add your first game";
    const title = currentView === "favorites" ? "Favorites" : currentView === "recent" ? "Recently played" : currentView === "collection" ? (library.collections.find(c => c.id === currentCollection)?.name || "Collection") : "All games";
    $("#view-title").textContent = title;
    $("#page-heading").innerHTML = `${escapeHtml(title === "All games" ? "Your Library" : title)}<span class="period">.</span>`;
    $("#library-summary").textContent = `${games.length} ${games.length === 1 ? "title" : "titles"} in your collection.`;
    $("#results-label").textContent = currentView === "favorites" ? "YOUR FAVORITES" : currentView === "recent" ? "RECENTLY PLAYED" : currentView === "collection" ? "COLLECTION" : "ALL TITLES";
    $$(".nav-item[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === currentView));
    $$(".view-button").forEach(button => button.classList.toggle("active", button.id === (mode === "grid" ? "grid-view-button" : "list-view-button")));
    const collapsed = Boolean(library.settings?.sidebarCollapsed);
    $(".app-shell").classList.toggle("sidebar-collapsed", collapsed && window.innerWidth > 650);
    $("#sidebar-toggle").textContent = collapsed ? "⇥" : "⇤";
    $("#sidebar-toggle").title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  }

  let selectedGameId = "";
  function showDetails(id) {
    const game = library.games.find(item => item.id === id);
    if (!game) return;
    selectedGameId = id;
    $("#details-screen").hidden = false;
    $("#details-screen").classList.add("is-open");
    $("#details-screen").setAttribute("aria-hidden", "false");
    $("#details-backdrop").hidden = false;
    requestAnimationFrame(() => $("#details-backdrop").classList.add("is-visible"));
    const cover = game.coverRemoved ? `<div class="cover-placeholder detail-cover-placeholder"><strong>NO COVER</strong><small>ARTWORK REMOVED</small></div>` : `<img class="detail-cover" src="${game.coverData || generateCustomCover(game.title, game.tags)}" alt="${escapeHtml(game.title)} cover">`;
    const tags = (game.tags || []).map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join("");
    const collection = library.collections.find(c => c.id === game.collectionId)?.name || "Unsorted";
    const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
    $("#details-content").innerHTML = `<div class="detail-hero"><div class="detail-cover-wrap">${cover}<button class="media-remove-button cover-remove-button" data-detail-action="remove-cover" data-id="${escapeHtml(game.id)}" ${game.coverRemoved ? "disabled" : ""}>Remove cover</button></div><div class="detail-copy"><p class="eyebrow">GAME PROFILE <span class="eyebrow-slash">/ WEBARCADE</span></p><h1>${escapeHtml(game.title)}<span class="period">.</span></h1><p class="detail-description">${escapeHtml(game.description || "No description yet. Add a few words about this game to make it your own.")}</p><div class="detail-tags">${tags || '<span class="tag-pill">Browser game</span>'}</div><div class="detail-actions"><button class="primary-button" data-detail-action="launch" data-id="${escapeHtml(game.id)}">↗ &nbsp; Launch game</button><button class="secondary-button" data-detail-action="favorite" data-id="${escapeHtml(game.id)}">${game.favorite ? "★ Favorited" : "☆ Add favorite"}</button><button class="secondary-button" data-detail-action="edit" data-id="${escapeHtml(game.id)}">✎ Edit details</button><button class="danger-button" data-detail-action="delete" data-id="${escapeHtml(game.id)}">Delete game</button></div></div></div><div class="detail-metadata"><div class="metadata-cell"><div class="metadata-label">COLLECTION</div><div class="metadata-value">${escapeHtml(collection)}</div></div><div class="metadata-cell"><div class="metadata-label">PLAY HISTORY</div><div class="metadata-value">${game.playCount || 0} launches${game.lastPlayedAt ? ` · Last played ${new Date(game.lastPlayedAt).toLocaleDateString()}` : " · Not played yet"}</div></div><div class="metadata-cell" style="grid-column:1/-1"><div class="metadata-label">GAME URL</div><div class="url-row"><div class="metadata-value">${escapeHtml(game.url)}</div><button data-detail-action="copy" data-id="${escapeHtml(game.id)}">Copy URL</button></div></div></div><div class="section-heading"><h2>Screenshots</h2><p>${screenshots.length ? `${screenshots.length} images` : "A closer look at the game"}</p></div>${screenshots.length ? `<div class="screenshot-strip">${screenshots.map((src,i)=>`<div class="screenshot-media-item"><button class="screenshot-thumb" data-detail-action="screenshot" data-index="${i}" aria-label="View screenshot ${i+1}"><img src="${src}" alt="${escapeHtml(game.title)} screenshot ${i+1}"></button><button class="media-remove-button" data-detail-action="remove-screenshot" data-index="${i}" data-id="${escapeHtml(game.id)}">Remove</button></div>`).join("")}</div>` : `<div class="screenshot-empty">No screenshots added yet. Edit this game to add your own artwork.</div>`}`;
    $("#details-screen").querySelector(".details-panel-header").scrollIntoView({block:"nearest"});
  }
  function launchGameWindow(game) {
    const url = safeUrl(game.url);
    if (!url) { showToast("This game has an invalid URL."); return; }
    game.lastPlayedAt = new Date().toISOString();
    game.playCount = (game.playCount || 0) + 1;
    saveLibrary();
    // Browsers do not allow a website to force true fullscreen on another origin.
    // Request a separate, screen-sized popup as the closest browser-safe behavior.
    const width = Math.max(800, window.screen?.availWidth || 1280);
    const height = Math.max(600, window.screen?.availHeight || 800);
    const features = `popup=yes,width=${width},height=${height},left=0,top=0`;
    const gameWindow = window.open(url, "_blank", features);
    if (!gameWindow) {
      showToast("The browser blocked the game window. Allow pop-ups for WebArcade and try again.");
      return;
    }
    try { gameWindow.focus(); } catch (_) {}
    showToast("Game launched in a separate window. Press F11 for true fullscreen if needed.");
  }

  function backToLibrary() {
    selectedGameId = "";
    const panel = $("#details-screen");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    $("#details-backdrop").classList.remove("is-visible");
    window.setTimeout(() => {
      if (!selectedGameId) { panel.hidden = true; $("#details-backdrop").hidden = true; }
    }, 240);
  }
  $("#details-content").addEventListener("click", async event => {
    const button = event.target.closest("[data-detail-action]"); if (!button) return;
    const game = library.games.find(item=>item.id===button.dataset.id) || library.games.find(item=>item.id===selectedGameId); if (!game) return;
    const action = button.dataset.detailAction;
    if (action === "launch") { launchGameWindow(game); showDetails(game.id); }
    if (action === "favorite") { game.favorite=!game.favorite; saveLibrary(); showDetails(game.id); }
    if (action === "edit") openGameDialog(game);
    if (action === "delete") { await deleteGameById(game.id); return; }
    if (action === "copy") { try { await navigator.clipboard.writeText(game.url); showToast("URL copied."); } catch { showToast("Copy isn't available in this browser."); } }
    if (action === "screenshot") { const src=game.screenshots?.[Number(button.dataset.index)]; if(src) { $("#lightbox-image").src=src; $("#lightbox").showModal(); } }
    if (action === "remove-cover") {
      if (!await confirmCoverRemoval(game.title)) return;
      const previousCoverData = game.coverData;
      const previousCoverRemoved = game.coverRemoved;
      // Removing an uploaded/custom cover should fall back to WebArcade's
      // generated artwork for blank covers, not create a permanent no-cover state.
      game.coverData = "";
      game.coverRemoved = false;
      const saved = saveLibrary();
      if (saved === false) {
        game.coverData = previousCoverData;
        game.coverRemoved = previousCoverRemoved;
        showToast("Could not remove cover because the change could not be saved.");
        return;
      }
      render();
      showDetails(game.id);
      showToast("Cover removed. Generated artwork is now being used.");
    }
    if (action === "remove-screenshot") { const index=Number(button.dataset.index); if (!Array.isArray(game.screenshots) || !game.screenshots[index]) return; game.screenshots.splice(index,1); saveLibrary(); render(); showDetails(game.id); showToast("Screenshot removed."); }
  });

  function renderCollections() {
    $("#collection-list").innerHTML = library.collections.map(collection =>
      `<div class="collection-nav-row"><button class="nav-item ${currentView === "collection" && currentCollection === collection.id ? "active" : ""}" data-collection="${escapeHtml(collection.id)}"><span>▧</span><span class="nav-text">${escapeHtml(collection.name)}</span><span class="nav-count">${library.games.filter(g => g.collectionId === collection.id).length}</span></button><button class="collection-manage" data-manage-collection="${escapeHtml(collection.id)}" aria-label="Edit ${escapeHtml(collection.name)} collection" title="Edit collection">···</button></div>`
    ).join("");
    $("#game-collection").innerHTML = `<option value="">None</option>` + library.collections.map(collection => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`).join("");
    const filter = $("#collection-filter"), selected = filter.value;
    filter.innerHTML = `<option value="">All collections</option>` + library.collections.map(collection => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`).join("");
    filter.value = selected;
  }

  function openGameDialog(game = null) {
    $("#game-form").reset();
    $("#form-error").textContent = "";
    $("#game-id").value = game?.id || "";
    $("#dialog-title").textContent = game ? "Edit game" : "Add a game";
    $("#game-title").value = game?.title || "";
    $("#game-url").value = game?.url || "";
    $("#game-description").value = game?.description || "";
    $("#game-tags").value = (game?.tags || []).join(", ");
    $("#game-collection").value = game?.collectionId || "";
    $("#game-favorite").checked = Boolean(game?.favorite);
    $("#delete-game-button").hidden = !game;
    $("#game-dialog").showModal();
    $("#game-title").focus();
  }

  async function readCover(file) {
    if (!file) return "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Please choose a cover smaller than 2 MB.");
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.readAsDataURL(file);
    });
  }

  $("#game-form").addEventListener("submit", async event => {
    event.preventDefault();
    const title = $("#game-title").value.trim();
    const url = safeUrl($("#game-url").value.trim());
    if (!title) return $("#form-error").textContent = "Enter a title.";
    if (!url) return $("#form-error").textContent = "Enter a valid http:// or https:// URL.";
    const existingId = $("#game-id").value;
    const existing = library.games.find(game => game.id === existingId);
    const file = $("#game-cover").files[0];
    let coverData = existing?.coverData || (existing?.coverRemoved ? "" : generateCustomCover(title, $("#game-tags").value.split(",").map(tag => tag.trim()).filter(Boolean)));
    let coverRemoved = Boolean(existing?.coverRemoved);
    try { if (file) { coverData = await readCover(file); coverRemoved = false; } }
    catch (error) { return $("#form-error").textContent = error.message; }
    let screenshots = existing?.screenshots || [];
    try {
      const files = [...$("#game-screenshots").files];
      if (files.length > 8) throw new Error("Choose up to 8 screenshots.");
      if (files.some(f => f.size > 2 * 1024 * 1024)) throw new Error("Each screenshot must be smaller than 2 MB.");
      if (files.length) screenshots = await Promise.all(files.map(readCover));
    } catch (error) { return $("#form-error").textContent = error.message; }

    const game = {
      id: existingId || makeId(title),
      title, url,
      description: $("#game-description").value.trim(),
      tags: $("#game-tags").value.split(",").map(tag => tag.trim()).filter(Boolean).slice(0, 20),
      collectionId: $("#game-collection").value,
      coverData,
      coverRemoved,
      screenshots,
      favorite: $("#game-favorite").checked,
      addedAt: existing?.addedAt || new Date().toISOString(),
      lastPlayedAt: existing?.lastPlayedAt || null,
      playCount: existing?.playCount || 0
    };
    if (existing) library.games = library.games.map(item => item.id === existingId ? game : item);
    else library.games.push(game);
    saveLibrary();
    $("#game-dialog").close();
    render();
    if (selectedGameId === game.id) showDetails(game.id);
    showToast(existing ? "Game updated." : "Game added to your library.");
  });

  // In-app confirmation is reliable even when the browser suppresses confirm().
  function confirmGameDeletion(title) {
    return new Promise(resolve => {
      let dialog = $("#delete-confirm-dialog");
      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "delete-confirm-dialog";
        dialog.className = "modal compact-modal";
        dialog.innerHTML = `
          <div class="modal-header">
            <div><p class="eyebrow">CONFIRM DELETION</p><h2>Delete this game?</h2></div>
            <button type="button" class="icon-button" data-delete-cancel aria-label="Cancel">×</button>
          </div>
          <p id="delete-confirm-message" class="modal-intro"></p>
          <div class="modal-actions"><span class="action-spacer"></span>
            <button type="button" class="secondary-button" data-delete-cancel>Cancel</button>
            <button type="button" class="danger-button" data-delete-confirm>Delete game</button>
          </div>`;
        document.body.appendChild(dialog);
      }
      $("#delete-confirm-message").textContent = `Are you sure you want to delete “${title}”? This cannot be undone unless you have a backup.`;
      const finish = value => {
        if (dialog.open) dialog.close();
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        resolve(value);
      };
      const onClick = event => {
        if (event.target.closest("[data-delete-confirm]")) finish(true);
        else if (event.target.closest("[data-delete-cancel]")) finish(false);
      };
      const onCancel = () => finish(false);
      dialog.addEventListener("click", onClick);
      dialog.addEventListener("cancel", onCancel);
      if (!dialog.open) dialog.showModal();
    });
  }

  function confirmCoverRemoval(title) {
    return new Promise(resolve => {
      let dialog = $("#cover-remove-confirm-dialog");
      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "cover-remove-confirm-dialog";
        dialog.className = "modal compact-modal";
        dialog.innerHTML = `
          <div class="modal-header">
            <div><p class="eyebrow">COVER ARTWORK</p><h2>Remove this cover?</h2></div>
            <button type="button" class="icon-button" data-cover-cancel aria-label="Cancel">×</button>
          </div>
          <p id="cover-remove-confirm-message" class="modal-intro"></p>
          <div class="modal-actions"><span class="action-spacer"></span>
            <button type="button" class="secondary-button" data-cover-cancel>Cancel</button>
            <button type="button" class="danger-button" data-cover-confirm>Remove cover</button>
          </div>`;
        document.body.appendChild(dialog);
      }
      $("#cover-remove-confirm-message").textContent = `Remove the current cover for “${title}”? WebArcade will show its generated custom cover instead.`;
      const finish = value => {
        if (dialog.open) dialog.close();
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        resolve(value);
      };
      const onClick = event => {
        if (event.target.closest("[data-cover-confirm]")) finish(true);
        else if (event.target.closest("[data-cover-cancel]")) finish(false);
      };
      const onCancel = () => finish(false);
      dialog.addEventListener("click", onClick);
      dialog.addEventListener("cancel", onCancel);
      if (!dialog.open) dialog.showModal();
    });
  }

  async function deleteGameById(id) {
    const game = library.games.find(item => item.id === id);
    if (!game) { showToast("Game could not be found. Refresh and try again."); return false; }
    if (!await confirmGameDeletion(game.title)) return false;
    const previousGames = library.games;
    library.games = previousGames.filter(item => item.id !== id);
    if (!saveLibrary()) {
      library.games = previousGames;
      render();
      showToast("Delete failed: browser storage could not save the change.");
      return false;
    }
    if (selectedGameId === id) backToLibrary();
    if ($("#game-dialog").open) $("#game-dialog").close();
    render();
    showToast(`“${game.title}” deleted.`);
    return true;
  }

  $("#delete-game-button").addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    const id = $("#game-id").value;
    if (!id) { showToast("Open an existing game to delete it."); return; }
    await deleteGameById(id);
  });

  $("#game-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const game = library.games.find(item => item.id === button.dataset.id);
    if (!game) return;
    if (button.dataset.action === "details") { showDetails(game.id); }
    else if (button.dataset.action === "favorite") {
      game.favorite = !game.favorite;
      saveLibrary();
      render();
    } else if (button.dataset.action === "edit") {
      openGameDialog(game);
    } else if (button.dataset.action === "launch") {
      launchGameWindow(game);
      render();
    }
  });

  $$(".nav-item[data-view]").forEach(button => button.addEventListener("click", () => {
    backToLibrary();
    currentView = button.dataset.view;
    currentCollection = "";
    currentFilter = "all";
    render();
  }));

  $$(".chip").forEach(button => button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    if (currentFilter === "favorites") currentView = "favorites";
    else if (currentView === "favorites") currentView = "all";
    render();
  }));
  $("#search").addEventListener("input", render);
  $("#collection-filter").addEventListener("change", render);
  $("#grid-view-button").addEventListener("click", () => { library.settings.viewMode = "grid"; saveLibrary(); render(); });
  $("#list-view-button").addEventListener("click", () => { library.settings.viewMode = "list"; saveLibrary(); render(); });
  $("#theme-toggle").addEventListener("click", () => { library.settings.theme = library.settings.theme === "dark" ? "light" : "dark"; saveLibrary(); render(); });
  $("#theme-select").addEventListener("change", event => { library.settings.theme = event.target.value; saveLibrary(); render(); });
  $("#density-select").addEventListener("change", event => { library.settings.density = event.target.value; saveLibrary(); render(); });
  $$(".accent-swatch").forEach(swatch => swatch.addEventListener("click", () => setAccentColor(swatch.dataset.accent)));
  $("#accent-hex").addEventListener("change", event => setAccentColor(event.target.value.trim()));
  $("#accent-hex").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); setAccentColor(event.target.value.trim()); } });
  $("#accent-color-picker").addEventListener("input", event => setAccentColor(event.target.value));
  $("#accent-reset").addEventListener("click", () => setAccentColor("#165DFF"));
  $("#sidebar-toggle").addEventListener("click", () => {
    if (window.innerWidth <= 650) {
      const sidebar = $(".sidebar");
      const isOpen = sidebar.classList.toggle("mobile-open");
      $("#sidebar-toggle").textContent = isOpen ? "×" : "☰";
      $("#sidebar-toggle").title = isOpen ? "Close sidebar" : "Open sidebar";
      $("#sidebar-toggle").setAttribute("aria-label", $("#sidebar-toggle").title);
      return;
    }
    library.settings.sidebarCollapsed = !library.settings.sidebarCollapsed;
    saveLibrary();
    render();
  });
  $("#sidebar-settings").addEventListener("click", () => { $(".sidebar").classList.remove("mobile-open"); $("#sidebar-toggle").textContent = "☰"; $("#sidebar-toggle").title = "Open sidebar"; $("#tools-dialog").showModal(); });
  $("#back-to-library").addEventListener("click", backToLibrary);
  $("#details-backdrop").addEventListener("click", backToLibrary);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && selectedGameId) backToLibrary(); });
  $("#game-list").addEventListener("click", event => { const action = event.target.closest("[data-action]"); if (!action) return; if (action.dataset.action === "details") showDetails(action.dataset.id); else { const game = library.games.find(g=>g.id===action.dataset.id); if (!game) return; if (action.dataset.action === "edit") openGameDialog(game); if (action.dataset.action === "favorite") { game.favorite=!game.favorite; saveLibrary(); render(); } } });
  $("#game-list").addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".list-card")) { event.preventDefault(); showDetails(event.target.dataset.id); } });
  $("#sort-select").addEventListener("change", event => { library.settings.sort = event.target.value; saveLibrary(); render(); });
  $("#add-game-button").addEventListener("click", () => openGameDialog());
  $("#empty-add-button").addEventListener("click", () => openGameDialog());
  $("#settings-button").addEventListener("click", () => $("#tools-dialog").showModal());
  function openCollectionDialog(collection = null) {
    $("#collection-form").reset();
    $("#collection-id").value = collection?.id || "";
    $("#collection-dialog-title").textContent = collection ? "Edit collection" : "New collection";
    $("#save-collection-button").textContent = collection ? "Save changes" : "Create";
    $("#delete-collection-button").hidden = !collection;
    $("#collection-name").value = collection?.name || "";
    $("#collection-dialog").showModal();
    $("#collection-name").focus();
  }
  $("#add-collection").addEventListener("click", () => openCollectionDialog());
  $("#collection-list").addEventListener("click", event => {
    const manage = event.target.closest("[data-manage-collection]");
    if (manage) {
      event.stopPropagation();
      const collection = library.collections.find(c => c.id === manage.dataset.manageCollection);
      if (collection) openCollectionDialog(collection);
      return;
    }
    const button = event.target.closest("[data-collection]");
    if (!button) return;
    backToLibrary(); currentView = "collection"; currentCollection = button.dataset.collection; currentFilter = "all"; render();
  });
  $("#collection-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#collection-name").value.trim();
    const existingId = $("#collection-id").value;
    if (!name) return;
    if (library.collections.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== existingId)) return showToast("That collection already exists.");
    if (existingId) {
      const collection = library.collections.find(c => c.id === existingId);
      if (!collection) return;
      collection.name = name;
      showToast("Collection renamed.");
    } else {
      const id = `collection-${Date.now().toString(36)}`;
      library.collections.push({ id, name });
      currentView = "collection"; currentCollection = id;
      showToast("Collection created.");
    }
    saveLibrary(); $("#collection-dialog").close(); render();
  });

  function confirmCollectionDeletion(name) {
    return new Promise(resolve => {
      let dialog = $("#collection-delete-confirm-dialog");
      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "collection-delete-confirm-dialog";
        dialog.className = "modal compact-modal";
        dialog.innerHTML = `
          <div class="modal-header">
            <div><p class="eyebrow">CONFIRM DELETION</p><h2>Delete this collection?</h2></div>
            <button type="button" class="icon-button" data-collection-cancel aria-label="Cancel">×</button>
          </div>
          <p id="collection-delete-confirm-message" class="modal-intro"></p>
          <div class="modal-actions"><span class="action-spacer"></span>
            <button type="button" class="secondary-button" data-collection-cancel>Cancel</button>
            <button type="button" class="danger-button" data-collection-confirm>Delete collection</button>
          </div>`;
        document.body.appendChild(dialog);
      }
      dialog.querySelector("#collection-delete-confirm-message").textContent = `Delete “${name}”? Games in this collection will stay in your library but become unassigned.`;
      const finish = value => {
        if (dialog.open) dialog.close();
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        resolve(value);
      };
      const onClick = event => {
        if (event.target.closest("[data-collection-confirm]")) finish(true);
        else if (event.target.closest("[data-collection-cancel]")) finish(false);
      };
      const onCancel = () => finish(false);
      dialog.addEventListener("click", onClick);
      dialog.addEventListener("cancel", onCancel);
      if (!dialog.open) dialog.showModal();
    });
  }

  $("#delete-collection-button").addEventListener("click", async () => {
    const id = $("#collection-id").value;
    const collection = library.collections.find(c => c.id === id);
    if (!collection || !await confirmCollectionDeletion(collection.name)) return;
    const previousCollections = library.collections;
    const previousAssignments = library.games.map(game => [game.id, game.collectionId]);
    library.collections = previousCollections.filter(c => c.id !== id);
    library.games.forEach(game => { if (game.collectionId === id) game.collectionId = ""; });
    if (!saveLibrary()) {
      library.collections = previousCollections;
      const assignments = new Map(previousAssignments);
      library.games.forEach(game => { game.collectionId = assignments.get(game.id) ?? game.collectionId; });
      render();
      showToast("Delete failed: browser storage could not save the change.");
      return;
    }
    if (currentView === "collection" && currentCollection === id) { currentView = "all"; currentCollection = ""; }
    $("#collection-dialog").close(); render(); showToast("Collection deleted. Games were kept.");
  });

  $$("[data-close]").forEach(button => button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.close);
    if (dialog?.open) dialog.close();
  }));

  $("#export-button").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ ...library, exportedAt: new Date().toISOString(), app: "WebArcade" }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `webarcade-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Library backup exported.");
  });

  function chooseLibraryImportMode() {
    return new Promise(resolve => {
      let dialog = document.getElementById("import-confirm-dialog");
      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "import-confirm-dialog";
        dialog.className = "modal compact-modal";
        dialog.innerHTML = `
          <div class="modal-header">
            <div><p class="eyebrow">IMPORT BACKUP</p><h2>How should we import?</h2></div>
            <button type="button" class="icon-button" data-import-cancel aria-label="Cancel">×</button>
          </div>
          <p class="modal-intro">Choose how the backup should be applied to your current library.</p>
          <div class="import-mode-options">
            <button type="button" class="tool-row" data-import-merge><span class="tool-icon">＋</span><span><strong>Import &amp; merge</strong><small>Add games and collections from the backup. Existing items are kept; matching items are updated.</small></span></button>
            <button type="button" class="tool-row" data-import-replace><span class="tool-icon">↻</span><span><strong>Import &amp; replace</strong><small>Replace the current games and collections with the backup.</small></span></button>
          </div>
          <div class="modal-actions"><span class="action-spacer"></span><button type="button" class="secondary-button" data-import-cancel>Cancel</button></div>`;
        document.body.appendChild(dialog);
      }
      const finish = value => {
        if (dialog.open) dialog.close();
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        resolve(value);
      };
      const onClick = event => {
        if (event.target.closest("[data-import-merge]")) finish("merge");
        else if (event.target.closest("[data-import-replace]")) finish("replace");
        else if (event.target.closest("[data-import-cancel]")) finish(null);
      };
      const onCancel = () => finish(null);
      dialog.addEventListener("click", onClick);
      dialog.addEventListener("cancel", onCancel);
      if (!dialog.open) dialog.showModal();
    });
  }

  $("#import-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.games) || !Array.isArray(parsed.collections)) {
        throw new Error("This file doesn't look like a WebArcade library backup. Choose a WebArcade JSON export.");
      }
      // Validate and normalize everything before changing the current library.
      const importedGames = parsed.games.map((game, index) => {
        if (!game || typeof game !== "object" || typeof game.title !== "string" || !game.title.trim() || !safeUrl(game.url)) {
          throw new Error(`Game #${index + 1} has an invalid title or URL. Your current library has not been changed.`);
        }
        return {
          ...game,
          id: String(game.id || `imported-game-${index + 1}`),
          title: game.title.trim(),
          url: safeUrl(game.url),
          description: typeof game.description === "string" ? game.description : "",
          coverData: typeof game.coverData === "string" ? game.coverData : "",
          coverRemoved: Boolean(game.coverRemoved),
          screenshots: Array.isArray(game.screenshots) ? game.screenshots.filter(item => typeof item === "string") : [],
          tags: Array.isArray(game.tags) ? game.tags : [],
          favorite: Boolean(game.favorite),
          playCount: Number.isFinite(Number(game.playCount)) ? Number(game.playCount) : 0
        };
      });
      const importedCollections = parsed.collections.map((collection, index) => {
        if (!collection || typeof collection !== "object" || typeof collection.name !== "string" || !collection.name.trim()) {
          throw new Error(`Collection #${index + 1} is invalid. Your current library has not been changed.`);
        }
        return { id: String(collection.id || `imported-collection-${index + 1}`), name: collection.name.trim() };
      });
      const importMode = await chooseLibraryImportMode();
      if (!importMode) return;

      const previousLibrary = library;
      if (importMode === "replace") {
        library = {
          schemaVersion: 1,
          games: importedGames,
          collections: importedCollections,
          settings: {
            ...previousLibrary.settings,
            ...(parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {})
          }
        };
      } else {
        // Merge by stable IDs. Existing matching items are updated by the backup;
        // unmatched local items remain in the library.
        const mergedGames = new Map(previousLibrary.games.map(game => [String(game.id), game]));
        importedGames.forEach(game => mergedGames.set(String(game.id), { ...(mergedGames.get(String(game.id)) || {}), ...game }));
        const mergedCollections = new Map(previousLibrary.collections.map(collection => [String(collection.id), collection]));
        importedCollections.forEach(collection => mergedCollections.set(String(collection.id), { ...(mergedCollections.get(String(collection.id)) || {}), ...collection }));
        library = {
          ...previousLibrary,
          schemaVersion: 1,
          games: [...mergedGames.values()],
          collections: [...mergedCollections.values()]
        };
      }
      if (!saveLibrary()) {
        library = previousLibrary;
        render();
        throw new Error("Import couldn't be saved in this browser. Your current library has been restored; try a smaller backup or export a copy first.");
      }
      render();
      $("#tools-dialog").close();
      showToast(importMode === "merge"
        ? `Backup merged: ${importedGames.length} games imported; existing items kept.`
        : `Library replaced with backup (${importedGames.length} games).`);
    } catch (error) {
      console.error("Library import failed:", error);
      showToast(error.message || "Could not import that backup.");
    } finally {
      event.target.value = "";
    }
  });

  $("#reset-demo-button").addEventListener("click", () => {
    if (library.games.length && !confirm("Add the sample games to your current library? Existing games will be kept.")) return;
    const sample = starterLibrary();
    sample.games.forEach(game => { if (!game.coverData) game.coverData = generateCustomCover(game.title, game.tags); });
    const existingIds = new Set(library.games.map(g => g.id));
    library.games.push(...sample.games.filter(g => !existingIds.has(g.id)));
    const existingCollections = new Set(library.collections.map(c => c.id));
    library.collections.push(...sample.collections.filter(c => !existingCollections.has(c.id)));
    saveLibrary();
    render();
    showToast("Sample games are ready.");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("#search").focus();
    }
  });

  library = loadLibrary();
  let generatedMissingCovers = false;
  library.games.forEach(game => {
    if (!game.coverData && !game.coverRemoved) { game.coverData = generateCustomCover(game.title, game.tags || []); generatedMissingCovers = true; }
  });
  if (!library.settings) library.settings = {};
  library.settings = { theme: "light", sort: "added", density: "compact", viewMode: "grid", sidebarCollapsed: false, accentColor: "#165DFF", ...library.settings };
  $("#sort-select").value = library.settings.sort;
  $("#lightbox")?.addEventListener("click", event => { if (event.target.id === "lightbox" || event.target.closest("[data-close-lightbox]")) $("#lightbox").close(); });
  if (!localStorage.getItem(STORAGE_KEY) || generatedMissingCovers) saveLibrary();
  render();
})(); 
