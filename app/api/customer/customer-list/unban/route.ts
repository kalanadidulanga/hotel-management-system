import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";


export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    // Ban customer by setting isActive to false
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json(
      { message: "Customer banned successfully", customer },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error banning customer:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
