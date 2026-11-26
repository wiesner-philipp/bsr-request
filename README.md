# Beat Saber Requests

Guests search maps from [BeatSaver](https://beatsaver.com) and press one button per map.
The service then posts `!bsr CODE` into your Twitch chat. Built for Beat Saber parties with a Twitch chat bot.

- Search, sorting and cover previews, one button per map
- Per-guest and per-map cooldowns against spam
- UI in German and English: the default language is set in the admin, guests switch themselves with the DE/EN toggle (BeatSaver content stays untranslated)
- Settings in the browser at `/admin`, no client secret required
- Multi-arch image (amd64 and arm64, also runs on a Raspberry Pi)

## Quick start

```
cp .env.example .env      # set ADMIN_PASSWORD
docker compose up -d
```

Or without Compose:

```
docker run -d --name bsr-requests -p 3000:3000 \
  -e ADMIN_PASSWORD="change-me" \
  -v bsr-data:/data \
  ghcr.io/wiesner-philipp/bsr-requests:latest
```

- Request page: http://localhost:3000
- Settings: http://localhost:3000/admin

## Setup

1. Create an app at https://dev.twitch.tv/console/apps. Client type **Public**, OAuth redirect URL `http://localhost`.
2. In the admin, enter the client ID and the target channel, then save.
3. Click "Connect to Twitch" and enter the displayed code on the Twitch page, using the account that should post the messages.
4. Done. Tokens are stored in the `/data` volume and refreshed automatically.

## Configuration

| Variable         | Default   | Description                                                                  |
| ---------------- | --------- | ---------------------------------------------------------------------------- |
| `ADMIN_PASSWORD` | *(empty)* | Password for `/admin`. If empty, one is generated and printed in the log.    |
| `TRUST_PROXY`    | `0`       | Set to `1` behind a reverse proxy so the real guest IP is used.              |
| `PORT`           | `3000`    | Port inside the container.                                                   |
| `DATA_DIR`       | `/data`   | Location of `config.json` (mount a volume here).                             |

Everything else (channel, message template, cooldowns, default language) is configured in the admin.

## Notes

- Run it behind HTTPS (Caddy, Traefik, nginx).
- The posting account must be allowed to chat in the target channel (not banned, mind follower/sub-only mode).
- The admin password and tokens are stored in `/data/config.json`. Do not share the volume.

## Development

```
npm install
DATA_DIR=./data ADMIN_PASSWORD=test npm start
```

Every push to `main` triggers GitHub Actions, which builds the image and publishes it as `ghcr.io/wiesner-philipp/bsr-requests:latest`.
Tags like `v1.2.0` additionally produce the version tags `1.2.0` and `1.2`.

## Support

If this made your party better, I would appreciate a coffee. Entirely optional, of course.
