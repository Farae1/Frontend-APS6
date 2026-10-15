# Kiosk

Shows the app full screen on the Raspberry Pi's own display (a TV now, a
touch display later), using a webcam connected to the Pi.

```bash
docker compose up -d     # the containers restart on their own after a reboot
kiosk/install.sh         # once
```

After that, logging into the desktop opens Chromium in kiosk mode at
`http://localhost:8080` as soon as the API answers. The kiosk uses its own
browser profile (`~/.config/aps6-kiosk`) and uses the camera without asking
(only this app runs in the kiosk).

- Close it: `Alt+F4`. Reopen: menu → "APS-6 Quiosque", or run
  `~/.local/share/aps6-kiosk/start.sh`.
- Bigger UI on a TV: `APS6_ZOOM=1.5 ~/.local/share/aps6-kiosk/start.sh`.
- Typing on a touch display: the app shows its own keyboard (the name in the
  registration, the base minister's password). Chromium also runs on Wayland
  with the input method on, so the system's on-screen keyboard (squeekboard)
  can open in any other field.
- Uninstall: remove `~/.config/autostart/aps6-kiosk.desktop`,
  `~/.local/share/applications/aps6-kiosk.desktop` and `~/.local/share/aps6-kiosk`.
