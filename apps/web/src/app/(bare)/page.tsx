import { redirect } from "next/navigation";

// Login and auth aren't set up yet, so the landing page sends everyone straight to the app.
export default function Page() {
  redirect("/home");
}
