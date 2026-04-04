#!/bin/bash
# Run this ONCE to install the auto-sync background job.
# After this, sync.sh runs every 5 minutes automatically — no manual commands needed.

PLIST_SRC="/Users/shreyansh/Desktop/InvestmentIntel/Stock portfolio/com.vastav.portfolio-sync.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.vastav.portfolio-sync.plist"

# Stop existing agent if running
launchctl unload "$PLIST_DST" 2>/dev/null

# Install
cp "$PLIST_SRC" "$PLIST_DST"
launchctl load "$PLIST_DST"

echo "✅ Auto-sync installed. sync.sh will now run every 5 minutes."
echo "   To stop it:  launchctl unload ~/Library/LaunchAgents/com.vastav.portfolio-sync.plist"
echo "   To check:    launchctl list | grep vastav"
echo "   Logs at:     /Users/shreyansh/Desktop/portfolio-intelligence/sync.log"
