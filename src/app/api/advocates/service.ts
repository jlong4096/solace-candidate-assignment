import { and, asc, desc, eq, gt, lt, ilike, or } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import db from "@/db";
import { advocates } from "@/db/schema";

const advocatesSelectSchema = createSelectSchema(advocates, {
  specialties: z.string().array(),
});

export type Advocate = z.infer<typeof advocatesSelectSchema>;

export interface QueryAdvocatesResponse {
  data: Advocate[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function searchClause(search: string) {
  const searchNum = Number(search);
  return or(
    ilike(advocates.firstName, `%${search}%`),
    ilike(advocates.lastName, `%${search}%`),
    ilike(advocates.city, `%${search}%`),
    ilike(advocates.degree, `%${search}%`),
    // ilike(advocates.specialties, `%${search}%`),
    !isNaN(searchNum) ? eq(advocates.yearsOfExperience, searchNum) : undefined,
  );
}

export async function queryAdvocates(
  search?: string,
  next?: number,
  previous?: number,
  pageSize = 5,
): Promise<QueryAdvocatesResponse> {
  let data = null;
  const clause = search ? searchClause(search) : undefined;
  if (next !== undefined) {
    data = await db
      .select()
      .from(advocates)
      .where(
        clause ? and(gt(advocates.id, next), clause) : gt(advocates.id, next),
      )
      .limit(pageSize + 1)
      .orderBy(asc(advocates.id));
  } else if (previous !== undefined) {
    data = await db
      .select()
      .from(advocates)
      .where(
        clause
          ? and(lt(advocates.id, previous), clause)
          : lt(advocates.id, previous),
      )
      .limit(pageSize + 1)
      .orderBy(desc(advocates.id));

    data = data.toReversed();
  } else {
    data = await db
      .select()
      .from(advocates)
      .where(clause ? clause : undefined)
      .limit(pageSize + 1)
      .orderBy(asc(advocates.id));
  }

  let parsed = data.map((d) => advocatesSelectSchema.parse(d));

  const fullPage = parsed.length === pageSize + 1;
  let hasNextPage = fullPage;
  let hasPreviousPage = !!next;
  if (previous) {
    hasNextPage = true;
    hasPreviousPage = fullPage;
    if (fullPage) {
      parsed = parsed.slice(pageSize * -1);
    }
  } else if (fullPage) {
    parsed = parsed.slice(0, pageSize);
  }

  return {
    data: parsed,
    hasNextPage,
    hasPreviousPage,
  };
}
