# mhacks2026

A [Spectrum](https://photon.codes/docs/spectrum-ts) project. Wired with: imessage.

## Environment

Before running, open `.env` and fill in the values:

From your project Settings on the [Photon dashboard](https://app.photon.codes):

- `PROJECT_ID`
- `PROJECT_SECRET`

And for Recall:

- `QUIZ_URL` (optional): the quiz link sent as a card when the student texts `app` and after `next day`. Leave it empty and Photon builds it from the running Cloudflare quick tunnel (`https://<tunnel>/quizzes/take`), so a restarted tunnel needs no edits. Set `CLOUDFLARED_METRICS` if cloudflared's metrics port isn't 20241-20245.

## Run

```sh
npm install
npm run start
```

## Where to go next

- [Spectrum docs](https://photon.codes/docs/spectrum-ts)
- Edit `src/index.ts` to replace the echo loop with real agent logic.
- Add more providers from `spectrum-ts/providers/*`.
