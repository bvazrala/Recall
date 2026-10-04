import { Spectrum } from "spectrum-ts";
import { imessage } from "@spectrum-ts/imessage";
import { appCard, isAppRequest } from "./app-card.ts";
import { AlreadyAdvancedError, formatMorning, isNextDayRequest, startNextDay } from "./morning.ts";

// Spectrum bridges a single agent loop to many messaging interfaces.
// Each provider in `providers` adds an interface (terminal TUI, iMessage, …).
// Docs: https://photon.codes/docs/spectrum-ts
const app = await Spectrum({
  projectId: process.env.PROJECT_ID!,
  projectSecret: process.env.PROJECT_SECRET!,
  providers: [
    // imessage
    imessage.config(),
  ],
});

// Ids of "next day" texts already handled, so a repeated delivery doesn't skip a second day.
const handledNextDay = new Set<string>();

// `app.messages` is an async iterable. Each tick yields a `space` (the
// conversation) and an inbound `message`. Reply by awaiting `space.send(...)`.
for await (const [space, message] of app.messages) {
 if (message.content.type === "text") {
  if (isAppRequest(message.content.text)) {
    await space.send(appCard());
  } else if (isNextDayRequest(message.content.text) && message.sender) {
    if (handledNextDay.has(message.id)) continue;
    handledNextDay.add(message.id);
    // Demo: close the sender's day, then send the next day's morning message and quiz card.
    try {
      const day = await startNextDay(message.sender.id);
      await space.send(formatMorning(day));
      await space.send(appCard());
    } catch (err) {
      if (err instanceof AlreadyAdvancedError) continue; // two requests raced; the other one already moved the day
      console.error(err);
      await space.send("Couldn't start the next day. Is the Recall server running?");
    }
  } else {
    await space.send(`echo : ${message.content.text}`);
  }
}
}
