import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await prisma.reviewAdjustment.create({
    data: {
      userId: session.user.id,
      feedback: body.feedback ?? null,
      signalType: body.signalType,
      reviewTone: body.reviewTone ?? null,
      reviewRating: body.reviewRating != null ? Number(body.reviewRating) : null,
      restaurantType: body.restaurantType ?? null,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adjustments = await prisma.reviewAdjustment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      feedback: true,
      signalType: true,
      reviewTone: true,
      reviewRating: true,
      restaurantType: true,
    },
  });

  return NextResponse.json(adjustments);
}
