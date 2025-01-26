import { asc, gt } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import db from "@/db";
import { advocates } from "@/db/schema";

const advocatesSelectSchema = createSelectSchema(advocates, {
  specialties: z.string().array(),
});

export type Advocate = z.infer<typeof advocatesSelectSchema>;

export async function getAdvocates(
  cursor?: number,
  pageSize = 15,
): Promise<Advocate[]> {
  const data = await db
    .select()
    .from(advocates)
    .where(cursor ? gt(advocates.id, cursor) : undefined)
    .limit(pageSize)
    .orderBy(asc(advocates.id));
  const parsed = data.map((d) => advocatesSelectSchema.parse(d));
  return parsed;
}
