import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { message: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: true,
        complementaryItems: true,
        room: true,
        roomTypeDetails: true
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { message: "Failed to fetch reservation details" },
      { status: 500 }
    );
  }
}