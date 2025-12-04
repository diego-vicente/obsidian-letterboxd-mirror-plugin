#!/bin/bash

# Install Letterboxd Mirror plugin to a local Obsidian vault
# Usage: OBSIDIAN_VAULT=/path/to/vault ./install-local.sh

set -e

# Plugin ID (must match manifest.json)
PLUGIN_ID="letterboxd-mirror"

# Get script directory (where the plugin source is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if OBSIDIAN_VAULT is set
if [ -z "$OBSIDIAN_VAULT" ]; then
    echo "Error: OBSIDIAN_VAULT environment variable is not set"
    echo "Usage: OBSIDIAN_VAULT=/path/to/vault ./install-local.sh"
    exit 1
fi

# Expand ~ if present
OBSIDIAN_VAULT="${OBSIDIAN_VAULT/#\~/$HOME}"

# Check if vault exists
if [ ! -d "$OBSIDIAN_VAULT" ]; then
    echo "Error: Vault directory does not exist: $OBSIDIAN_VAULT"
    exit 1
fi

# Check if .obsidian folder exists
OBSIDIAN_DIR="$OBSIDIAN_VAULT/.obsidian"
if [ ! -d "$OBSIDIAN_DIR" ]; then
    echo "Error: Not a valid Obsidian vault (missing .obsidian folder): $OBSIDIAN_VAULT"
    exit 1
fi

# Create plugins directory if it doesn't exist
PLUGINS_DIR="$OBSIDIAN_DIR/plugins"
mkdir -p "$PLUGINS_DIR"

# Create plugin directory
PLUGIN_DIR="$PLUGINS_DIR/$PLUGIN_ID"
mkdir -p "$PLUGIN_DIR"

# Required files
REQUIRED_FILES=("main.js" "manifest.json")
OPTIONAL_FILES=("styles.css")

# Check if main.js exists (needs build)
if [ ! -f "$SCRIPT_DIR/main.js" ]; then
    echo "main.js not found. Building plugin..."
    (cd "$SCRIPT_DIR" && npm run build)
fi

# Copy required files
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$PLUGIN_DIR/"
        echo "Copied $file"
    else
        echo "Error: Required file not found: $file"
        exit 1
    fi
done

# Copy optional files
for file in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$PLUGIN_DIR/"
        echo "Copied $file"
    fi
done

echo ""
echo "Plugin installed to: $PLUGIN_DIR"
echo ""
echo "Next steps:"
echo "  1. Reload Obsidian (Cmd+R or Ctrl+R)"
echo "  2. Go to Settings → Community plugins"
echo "  3. Enable '$PLUGIN_ID'"
echo "  4. Configure your Letterboxd username in the plugin settings"
