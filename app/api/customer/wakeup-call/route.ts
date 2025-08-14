import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const wakeUpCalls = await prisma.wakeUpCall.findMany({
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            countryCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wakeUpCalls);
  } catch (error: any) {
    console.error("Error fetching wake up calls:", error);
    return NextResponse.json(
      { message: "Failed to fetch wake up calls", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, date, time, remarks } = body;

    // Validate input
    if (!customerId || !date || !time) {
      return NextResponse.json(
        { message: "customerId, date, and time are required" },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        countryCode: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    // Create wake up call
    const wakeUpCall = await prisma.wakeUpCall.create({
      data: {
        customerId,
        customerName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
        customerPhone: `${customer.countryCode} ${customer.phone}`,
        date: new Date(date),
        time,
        remarks: remarks || null,
        status: "Pending",
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            countryCode: true,
          },
        },
      },
    });

    return NextResponse.json(wakeUpCall, { status: 201 });
  } catch (error: any) {
    console.error("Error creating wake up call:", error);
    return NextResponse.json(
      { message: "Failed to create wake up call", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, customerId, date, time, remarks, status } = body;

    // Validate input
    if (!id || !customerId || !date || !time) {
      return NextResponse.json(
        { message: "id, customerId, date, and time are required" },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        countryCode: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    // Update wake up call
    const wakeUpCall = await prisma.wakeUpCall.update({
      where: { id },
      data: {
        customerId,
        customerName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
        customerPhone: `${customer.countryCode} ${customer.phone}`,
        date: new Date(date),
        time,
        remarks: remarks || null,
        ...(status && { status }),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            countryCode: true,
          },
        },
      },
    });

    return NextResponse.json(wakeUpCall);
  } catch (error: any) {
    console.error("Error updating wake up call:", error);
    return NextResponse.json(
      { message: "Failed to update wake up call", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    // Validate input
    if (!id) {
      return NextResponse.json(
        { message: "Wake up call ID is required" },
        { status: 400 }
      );
    }

    // Delete wake up call
    const deleted = await prisma.wakeUpCall.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (error: any) {
    console.error("Error deleting wake up call:", error);
    return NextResponse.json(
      { message: "Failed to delete wake up call", error: error.message },
      { status: 500 }
    );
  }
}
