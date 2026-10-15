#!/bin/sh
# Opens the app full screen on this machine's display (kiosk mode), once the
# containers are up. Started by the desktop session (see install.sh). The
# camera is granted without asking (--use-fake-ui-for-media-stream): only
# this app runs in the kiosk. The camera is opened directly (V4L2), not
# through PipeWire: on Raspberry Pi OS that path waits forever for the
# desktop portal's permission. On a touch display, the on-screen keyboard
# (squeekboard) opens when a text field gets focus: Chromium runs on Wayland
# and reports the focus through text-input-v3.
#
#   APS6_URL    where the app is (default: http://localhost:8080; localhost
#               lets the browser use the camera without HTTPS)
#   APS6_ZOOM   UI scale (default 1; e.g. 1.5 on a big TV)

URL="${APS6_URL:-http://localhost:8080}"
ZOOM="${APS6_ZOOM:-1}"

# Wait for the stack (docker compose up) to answer.
until curl -sf "$URL/api/health" >/dev/null; do
    sleep 3
done

exec chromium \
    --kiosk "$URL" \
    --use-fake-ui-for-media-stream \
    --user-data-dir="$HOME/.config/aps6-kiosk" \
    --force-device-scale-factor="$ZOOM" \
    --no-first-run \
    --noerrdialogs \
    --disable-session-crashed-bubble \
    --disable-infobars \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disable-features=TranslateUI,WebRtcPipeWireCamera \
    --password-store=basic \
    --ozone-platform=wayland \
    --enable-wayland-ime \
    --wayland-text-input-version=3 \
    --check-for-update-interval=31536000
