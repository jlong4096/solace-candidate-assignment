import { getAdvocates } from "@/db/schema";

export async function GET() {
  const advocates = await getAdvocates();
  return Response.json({ data: advocates });
}
