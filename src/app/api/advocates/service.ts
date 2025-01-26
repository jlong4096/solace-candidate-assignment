import { asc, desc, gt, lt } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import db from "@/db";
import { advocates } from "@/db/schema";

const advocatesSelectSchema = createSelectSchema(advocates, {
  specialties: z.string().array(),
});

export type Advocate = z.infer<typeof advocatesSelectSchema>;

export async function getAdvocates(
  next?: number,
  previous?: number,
  pageSize = 5,
): Promise<Advocate[]> {
  let data = null;
  if (next !== undefined) {
    data = await db
      .select()
      .from(advocates)
      .where(gt(advocates.id, next))
      .limit(pageSize)
      .orderBy(asc(advocates.id));
  } else if (previous !== undefined) {
    data = await db
      .select()
      .from(advocates)
      .where(lt(advocates.id, previous))
      .limit(pageSize)
      .orderBy(desc(advocates.id));

    data = data.toReversed();
  } else {
    data = await db
      .select()
      .from(advocates)
      .limit(pageSize)
      .orderBy(asc(advocates.id));
  }
  const parsed = data.map((d) => advocatesSelectSchema.parse(d));
  return parsed;
}
