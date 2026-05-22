import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_RADAR = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

const KEYWORDS: Record<string, string[]> = {
  spicy:  ["spicy", "pepper", "hot", "suya", "jollof", "scotch", "chilli", "peppersoup"],
  sweet:  ["sweet", "sugary", "dessert", "cake", "chin chin", "puff puff", "juice", "smoothie"],
  savory: ["savory", "savoury", "smoky", "grilled", "roasted", "bbq", "barbecue", "asun", "kilishi"],
  local:  ["local", "buka", "mama put", "amala", "eba", "fufu", "egusi", "ogbono", "naija", "nigerian", "abula"],
  social: ["family", "friends", "date", "group", "party", "hangout", "outing", "everyone"],
};

function countKeywords(texts: string[], keywords: string[]): number {
  const combined = texts.join(" ").toLowerCase();
  return keywords.reduce((total, kw) => {
    const escaped = kw.replace(/\s+/g, "\\s+");
    const matches = combined.match(new RegExp(escaped, "gi"));
    return total + (matches ? matches.length : 0);
  }, 0);
}

function hitsToScore(hits: number, reviewCount: number): number {
  if (hits === 0) return 0.3;
  const scaled = Math.min(1.0, hits / (reviewCount * 1.5));
  return Math.round((0.1 + scaled * 0.9) * 100) / 100;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.savedReview.findMany({
    where: { userId: session.user.id },
    select: { restaurantName: true, reviewText: true, rating: true },
  });

  if (reviews.length === 0) {
    return NextResponse.json(DEFAULT_RADAR);
  }

  const texts = reviews.map((r) => `${r.restaurantName} ${r.reviewText}`);
  const n = reviews.length;

  const spicy  = hitsToScore(countKeywords(texts, KEYWORDS.spicy),  n);
  const sweet  = hitsToScore(countKeywords(texts, KEYWORDS.sweet),  n);
  const savory = hitsToScore(countKeywords(texts, KEYWORDS.savory), n);
  const local  = hitsToScore(countKeywords(texts, KEYWORDS.local),  n);
  const social = hitsToScore(countKeywords(texts, KEYWORDS.social), n);

  const uniqueNames = new Set(reviews.map((r) => r.restaurantName.toLowerCase().trim())).size;
  const uniqueRatio = uniqueNames / n;
  const ratings = reviews.map((r) => r.rating);
  const mean = ratings.reduce((a, b) => a + b, 0) / n;
  const variance = ratings.reduce((sum, r) => sum + (r - mean) ** 2, 0) / n;
  const varScore = Math.min(1.0, variance / 2.5);
  const adventurous = Math.round((0.1 + (uniqueRatio * 0.6 + varScore * 0.4) * 0.9) * 100) / 100;

  return NextResponse.json([spicy, sweet, savory, local, adventurous, social]);
}
