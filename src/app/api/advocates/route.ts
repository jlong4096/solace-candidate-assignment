import { NextRequest, NextResponse } from "next/server";
import { getAdvocates } from "./service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const next = Number(searchParams.get("next") || undefined);
  const previous = Number(searchParams.get("previous") || undefined);
  const pageSize = Number(searchParams.get("limit") || undefined);

  const advocates = await getAdvocates(
    !isNaN(next) ? next : undefined,
    !isNaN(previous) ? previous : undefined,
    !isNaN(pageSize) ? pageSize : undefined,
  );
  return NextResponse.json({ data: advocates });
}
