import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/require-auth";
import {
  applyTrackingScanAction,
  lookupTrackingByCode,
} from "@/lib/tracking-scan-server";
import { isTrackingScanAction, isTrackingScanRole } from "@/lib/tracking-scan";

export async function GET(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.session.user.role;
  if (!isTrackingScanRole(role)) {
    return NextResponse.json(
      { error: "Only sellers, couriers, and employees can scan tracking codes." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = String(searchParams.get("code") ?? "");

  const result = await lookupTrackingByCode(
    code,
    auth.session.user.id,
    role,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ package: result.package });
}

export async function POST(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.session.user.role;
  if (!isTrackingScanRole(role)) {
    return NextResponse.json(
      { error: "Only sellers, couriers, and employees can scan tracking codes." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "");
  const action = String(body.action ?? "");

  if (!isTrackingScanAction(action)) {
    return NextResponse.json({ error: "Invalid scan action." }, { status: 400 });
  }

  const result = await applyTrackingScanAction(
    code,
    action,
    auth.session.user.id,
    role,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ package: result.package });
}
