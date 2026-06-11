import { redirect } from "next/navigation";

export default function Home() {
  // Send the root route to login because this app does not have a public landing page.
  redirect("/login");
}
