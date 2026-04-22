import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email?.endsWith("@usal.es")) {
      return NextResponse.json(
        { error: "Solo se permiten correos @usal.es" },
        { status: 400 }
      );
    }

    // Rate limit: max 5 tokens per email in last 15 minutes
    const recentTokens = await prisma.verificationToken.count({
      where: {
        identifier: email,
        expires: { gt: new Date() },
      },
    });

    if (recentTokens >= 5) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos." },
        { status: 429 }
      );
    }

    // Generate token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store in DB
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/auth/magic-callback?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendMagicLinkEmail(email, verifyUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "Error al enviar el enlace" },
      { status: 500 }
    );
  }
}
