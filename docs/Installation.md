# Installation

Letterboxd Mirror is pending approval for the Obsidian Community Plugins directory. Until then, you can install it manually.

## Manual Installation

### Option 1: Using the Install Script

If you have the source code cloned locally:

```bash
# Clone the repository
git clone https://github.com/diego-vicente/obsidian-letterboxd-mirror-plugin.git
cd obsidian-letterboxd-mirror-plugin

# Install dependencies and build
npm install
npm run build

# Install to your vault
OBSIDIAN_VAULT=/path/to/your/vault ./install-local.sh
```

The script will:
1. Build the plugin if needed
2. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugins folder
3. Print instructions for enabling the plugin

### Option 2: Manual File Copy

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/diego-vicente/obsidian-letterboxd-mirror-plugin/releases)
2. In your vault, create the folder `.obsidian/plugins/letterboxd-mirror/`
3. Copy the downloaded files into this folder
4. Reload Obsidian (Cmd+R on macOS, Ctrl+R on Windows/Linux)
5. Go to **Settings → Community plugins** and enable **Letterboxd Mirror**

## After Installation

1. Open **Settings → Letterboxd Mirror**
2. Enter your Letterboxd username
3. (Optional) Add your TMDB API token for Film notes
4. Click the clapperboard icon in the ribbon to sync

See [Usage](Usage.md) for detailed instructions.
