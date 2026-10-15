#!/bin/sh
# Sets up the kiosk on the Raspberry Pi (Raspberry Pi OS desktop, autologin):
# - the app opens full screen when the desktop starts;
# - an "APS-6 Quiosque" menu entry reopens it;
# - the camera is used without asking (see start.sh).
# Run as the desktop user.
set -e
here="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$HOME/.local/share/aps6-kiosk" "$HOME/.config/autostart" "$HOME/.local/share/applications"
cp "$here/start.sh" "$HOME/.local/share/aps6-kiosk/start.sh"
cp "$here/aps6-kiosk.desktop" "$HOME/.config/autostart/aps6-kiosk.desktop"
cp "$here/aps6-kiosk.desktop" "$HOME/.local/share/applications/aps6-kiosk.desktop"

echo "Kiosk installed: it opens on the next login, or run $HOME/.local/share/aps6-kiosk/start.sh"
