import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { offers } = await req.json();

    // Validate input data
    if (!Array.isArray(offers) || offers.length === 0) {
      return NextResponse.json(
        { error: "Invalid offers data - must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each offer
    for (const offer of offers) {
      if (!offer.roomType || !offer.date || offer.originalRate === undefined) {
        return NextResponse.json(
          { error: "Each offer must have roomType, date, and originalRate" },
          { status: 400 }
        );
      }

      // Validate discount percentage
      if (offer.offerDiscount !== null && offer.offerDiscount !== undefined) {
        if (
          typeof offer.offerDiscount !== "number" ||
          offer.offerDiscount < 0 ||
          offer.offerDiscount > 100
        ) {
          return NextResponse.json(
            { error: "Discount percentage must be a number between 0 and 100" },
            { status: 400 }
          );
        }
      }

      // Validate original rate
      if (typeof offer.originalRate !== "number" || offer.originalRate <= 0) {
        return NextResponse.json(
          { error: "Original rate must be a positive number" },
          { status: 400 }
        );
      }

      // Validate strings if provided
      if (offer.offerTitle && typeof offer.offerTitle !== "string") {
        return NextResponse.json(
          { error: "Offer title must be a string" },
          { status: 400 }
        );
      }

      if (offer.offerText && typeof offer.offerText !== "string") {
        return NextResponse.json(
          { error: "Offer text must be a string" },
          { status: 400 }
        );
      }
    }

    // Use transaction for batch upsert
    const result = await prisma.$transaction(async (tx) => {
      const savedOffers = [];

      for (const offer of offers) {
        const offerDate = new Date(offer.date);

        // Validate date
        if (isNaN(offerDate.getTime())) {
          throw new Error(`Invalid date format: ${offer.date}`);
        }

        const savedOffer = await tx.roomOffer.upsert({
          where: {
            roomType_date: {
              roomType: offer.roomType,
              date: offerDate,
            },
          },
          update: {
            originalRate: parseFloat(offer.originalRate),
            offerDiscount: offer.offerDiscount
              ? parseFloat(offer.offerDiscount)
              : null,
            offerTitle: offer.offerTitle || null,
            offerText: offer.offerText || null,
            updatedAt: new Date(),
          },
          create: {
            roomType: offer.roomType,
            date: offerDate,
            originalRate: parseFloat(offer.originalRate),
            offerDiscount: offer.offerDiscount
              ? parseFloat(offer.offerDiscount)
              : null,
            offerTitle: offer.offerTitle || null,
            offerText: offer.offerText || null,
          },
        });

        savedOffers.push(savedOffer);
      }

      return savedOffers;
    });

    return NextResponse.json(
      {
        message: "Room offers saved successfully",
        count: result.length,
        offers: result.map((offer) => ({
          id: offer.id,
          roomType: offer.roomType,
          date: offer.date.toISOString().split("T")[0],
          originalRate: offer.originalRate,
          offerDiscount: offer.offerDiscount,
          offerTitle: offer.offerTitle,
          offerText: offer.offerText,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error saving room offers:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate offer found for the same room type and date" },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid room type - room type does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save room offers", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get("roomType");
    const month = searchParams.get("month"); // e.g., "2025-08"

    if (!roomType || !month) {
      return NextResponse.json(
        { error: "roomType and month parameters are required" },
        { status: 400 }
      );
    }

    // Validate month format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM format" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);

    // Validate year and month values
    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: "Year must be between 2020 and 2030" },
        { status: 400 }
      );
    }

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    // Check if room type exists
    const roomTypeExists = await prisma.roomList.findUnique({
      where: { roomType },
      select: { roomType: true },
    });

    if (!roomTypeExists) {
      return NextResponse.json(
        { error: "Room type does not exist" },
        { status: 404 }
      );
    }

    const offers = await prisma.roomOffer.findMany({
      where: {
        roomType,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Format the response with calculated discounted rates
    const formattedOffers = offers.map((offer) => {
      const discountedRate = offer.offerDiscount
        ? offer.originalRate - (offer.originalRate * offer.offerDiscount) / 100
        : offer.originalRate;

      return {
        id: offer.id,
        roomType: offer.roomType,
        date: offer.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        originalRate: offer.originalRate,
        offerDiscount: offer.offerDiscount, // Percentage
        discountedRate: Math.round(discountedRate * 100) / 100, // Rounded to 2 decimals
        offerTitle: offer.offerTitle,
        offerText: offer.offerText,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      };
    });

    return NextResponse.json({
      roomType,
      month,
      offers: formattedOffers,
      summary: {
        totalOffers: formattedOffers.length,
        offersWithDiscount: formattedOffers.filter(
          (o) => o.offerDiscount && o.offerDiscount > 0
        ).length,
        averageDiscount:
          formattedOffers.length > 0
            ? Math.round(
                (formattedOffers.reduce(
                  (sum, o) => sum + (o.offerDiscount || 0),
                  0
                ) /
                  formattedOffers.length) *
                  100
              ) / 100
            : 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching room offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch room offers", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific offers
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get("roomType");
    const month = searchParams.get("month");
    const date = searchParams.get("date"); // Optional: delete specific date

    if (!roomType) {
      return NextResponse.json(
        { error: "roomType parameter is required" },
        { status: 400 }
      );
    }

    let whereClause: any = { roomType };

    if (date) {
      // Delete specific date
      const offerDate = new Date(date);
      if (isNaN(offerDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      whereClause.date = offerDate;
    } else if (month) {
      // Delete entire month
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return NextResponse.json(
          { error: "Invalid month format. Use YYYY-MM format" },
          { status: 400 }
        );
      }

      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);

      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const deletedOffers = await prisma.roomOffer.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({
      message: `Successfully deleted ${deletedOffers.count} offer(s)`,
      deletedCount: deletedOffers.count,
    });
  } catch (error: any) {
    console.error("Error deleting room offers:", error);
    return NextResponse.json(
      { error: "Failed to delete room offers", details: error.message },
      { status: 500 }
    );
  }
}
