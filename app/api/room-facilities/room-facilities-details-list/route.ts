

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facility_type, facility_name, description } = body;

    if (!facility_type || typeof facility_type !== "string") {
      return NextResponse.json(
        { message: "Valid facility_type (string) is required" },
        { status: 400 }
      );
    }

    if (!facility_name || typeof facility_name !== "string") {
      return NextResponse.json(
        { message: "Facility name is required" },
        { status: 400 }
      );
    }

    const facilityExists = await prisma.room_Facility_List.findUnique({
      where: { name: facility_type },
    });

    if (!facilityExists) {
      return NextResponse.json(
        { message: "Invalid facility_type: not found" },
        { status: 404 }
      );
    }

    const newFacilityDetail = await prisma.room_Facilities_Details_List.create({
      data: {
        facilityType: facility_type,
        facility_name,
        description,
      },
    });

    return NextResponse.json(newFacilityDetail, { status: 201 });
  } catch (error: any) {
    console.error("Error creating facility detail:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const data = await prisma.room_Facilities_Details_List.findMany({
      include: { facility_type: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching details:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(
  req: NextRequest,

) {
  try {
   

    const body = await req.json();
    const {id , facility_type, facility_name, description } = body;

    const existing = await prisma.room_Facilities_Details_List.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Facility detail not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.room_Facilities_Details_List.update({
      where: { id },
      data: {
        facilityType: facility_type,
        facility_name,
        description,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating detail:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  
) {
  try {
   
      const body = await req.json();
      const { id  } = body;

    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.room_Facilities_Details_List.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Facility detail not found" },
        { status: 404 }
      );
    }

    await prisma.room_Facilities_Details_List.delete({ where: { id } });

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting detail:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
