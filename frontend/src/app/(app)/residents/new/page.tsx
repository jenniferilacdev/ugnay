import { redirect } from "next/navigation";

// Registering a resident now happens in a modal from the Residents list.
// Keep this route as a redirect so old links don't 404.
export default function NewResidentRedirect() {
  redirect("/residents");
}
