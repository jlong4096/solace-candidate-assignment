import { sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  text,
  jsonb,
  serial,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import db from "@/db";

const advocates = pgTable("advocates", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  city: text("city").notNull(),
  degree: text("degree").notNull(),
  specialties: jsonb("payload").default([]).notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  phoneNumber: bigint("phone_number", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

const advocatesSelectSchema = createSelectSchema(advocates, {
  specialties: z.string().array(),
});

export type Advocate = z.infer<typeof advocatesSelectSchema>;

export async function getAdvocates(): Promise<Advocate[]> {
  const data = await db.select().from(advocates);
  const parsed = data.map((d) => advocatesSelectSchema.parse(d));
  return parsed;
}

export { advocates };
