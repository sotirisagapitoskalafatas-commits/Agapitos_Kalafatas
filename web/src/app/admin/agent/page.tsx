import { redirect } from "next/navigation";

export default function AgentPage() {
  redirect("/admin/crm?tab=ai");
}