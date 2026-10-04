import { Spectrum } from "spectrum-ts";
import { imessage } from "@spectrum-ts/imessage";
import { appCard, isAppRequest, NO_QUIZ_URL_TEXT, quizUrl } from "./app-card.ts";
import { AlreadyAdvancedError, formatMorning, isNextDayRequest, startNextDay } from "./morning.ts";
import { askRecall } from "./chat.ts";
import { startOutbox } from "./outbox.ts";

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

// Lets the Recall server text students first, e.g. the review after a quiz.
startOutbox(imessage(app));

// Ids of "next day" texts already handled, so a repeated delivery doesn't skip a second day.
const handledNextDay = new Set<string>();

// `app.messages` is an async iterable. Each tick yields a `space` (the
// conversation) and an inbound `message`. Reply by awaiting `space.send(...)`.
for await (const [space, message] of app.messages) {
 if (message.content.type === "text") {
  if (isAppRequest(message.content.text)) {
    const url = await quizUrl();
    await space.send(url ? appCard(url) : NO_QUIZ_URL_TEXT);
  } else if (isNextDayRequest(message.content.text) && message.sender) {
    if (handledNextDay.has(message.id)) continue;
    handledNextDay.add(message.id);
    // Demo: close the sender's day, then send the next day's morning message and quiz card.
    try {
      const day = await startNextDay(message.sender.id);
      await space.send(formatMorning(day));
      const url = await quizUrl();
      if (url) await space.send(appCard(url));
    } catch (err) {
      if (err instanceof AlreadyAdvancedError) continue; // two requests raced; the other one already moved the day
      console.error(err);
      await space.send("Couldn't start the next day. Is the Recall server running?");
    }
  } else if (message.sender) {
    // Anything else is a question for Recall: about today's quiz, its topics, or the MCAT.
    try {
      await space.startTyping();
      const reply = await askRecall(message.sender.id, message.content.text, message.id);
      if (reply) await space.send(reply);
    } catch (err) {
      console.error(err);
      await space.send("Recall is offline right now. Try again in a bit.");
    } finally {
      await space.stopTyping().catch(() => {});
    }
  }
}
}
