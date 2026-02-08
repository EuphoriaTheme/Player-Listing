# Player Listing (Blueprint Addon)

Show live player lists and player counts for your servers inside the Pterodactyl panel (via Blueprint).

## What This Addon Does
- Adds a server route (`/players`) to view online players for a server.
- Adds a "Players Online" stat block on the server console page.
- Optionally displays the player list on the console page (admin-configurable).
- Lets admins map Pterodactyl eggs to game types (used to pick the correct query endpoint).
- Lets admins override the game data API base URL.
- Lets users set per-server overrides (custom domain/IP, custom query port, selected game).

## Admin Configuration
In the admin panel: `Admin -> Extensions -> Player Listing`
- Egg to Game Mapping: map one or more eggs to a game.
- Console Page Configuration: toggle showing the player list on the console page.
- API Configuration: set a custom API URL (default: `https://api.euphoriadevelopment.uk/gameapi`).

## Data Sources / Privacy
Depending on the selected game/features:
- The game data API receives the server IP/domain and port to query.
- Minecraft features may call third-party services for UUID lookups and avatars/renders.

If you have privacy/compliance requirements, review these integrations before enabling the addon.

## Compatibility
- Blueprint Framework on Pterodactyl Panel
- Target: `beta-2026-01` (see `conf.yml`)

## Installation / Development Guides
Follow the official Blueprint guides for installing addons and developing components/extensions:
`https://blueprint.zip/guides`

Uninstall (as shown in the admin view):
`blueprint -remove playerlisting`

## How It Works (Repo Layout)
- `conf.yml`: Blueprint addon manifest (metadata, target version, entrypoints).
- `routes/web.php`: Backend endpoints for admin/user configuration.
- `admin/controller.php`: Admin backend for mappings/API URL/console config + user settings endpoints.
- `admin/view.blade.php`: Admin UI for mapping eggs to games + config.
- `components/Components.yml`: Registers the `/players` route and console-page injections.
- `components/fetchPlayers.tsx`: Main server page (`/players`).
- `components/fetchPlayersConsolePage.tsx`: Console-page player list widget.
- `components/playerCounts.tsx`: Console-page "Players Online" stat block.
- `client/wrapper.blade.php`: Loads any required client-side assets.
- `public/`: Bundled public assets.

## Contributing
This repo is shared so the community can help improve and extend the addon, not because it's abandoned.
You can customize it for your theme/workflow; if your changes are broadly useful, open a Pull Request.

### Pull Request Requirements
- Clearly state what's been added/updated and why.
- Include images or a short video of it working/in action (especially for UI changes).
- Keep changes focused and avoid unrelated formatting-only churn.
- Keep credits/attribution intact (see `LICENSE`).

## License
Source-available. Redistribution and resale (original or modified) are not permitted, and original credits must be kept within the addon.
See `LICENSE` for the full terms.
