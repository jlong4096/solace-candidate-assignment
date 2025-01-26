import { NextRequest, NextResponse } from "next/server";
import { getAdvocates } from "./service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = Number(searchParams.get("cursor"));
  const pageSize = Number(searchParams.get("limit"));

  const advocates = await getAdvocates(
    !isNaN(cursor) ? cursor : undefined,
    !isNaN(pageSize) ? pageSize : undefined,
  );
  return NextResponse.json({ data: advocates });
}
