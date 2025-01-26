import { getAdvocates } from "@/db/schema";

export async function GET() {
  return Response.json({ data: getAdvocates() });
}
