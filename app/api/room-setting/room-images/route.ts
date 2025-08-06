import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure uploads directory exists
async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
}

// Save uploaded file and return its URL path
async function saveFile(fieldName: string, formData: FormData) {
  const file = formData.get(fieldName) as File;
  if (!file || file.size === 0) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);

  await writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

// GET all room images
export async function GET() {
  try {
    const images = await prisma.roomImage.findMany({
      
      orderBy: { id: "asc" },
      include:{
        room:{
          select:{
            roomType : true,
          }
        }
      }
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room images" },
      { status: 500 }
    );
  }
}

// POST a new room image
export async function POST(req : NextRequest) {
  try {
    await ensureUploadDirExists();
    const formData = await req.formData();

    const imageUrl = await saveFile("image", formData);
    const roomTypeValue = formData.get("roomType");
   

    if (!imageUrl || !roomTypeValue) {
      return NextResponse.json(
        { message: "Image file and valid roomType are required" },
        { status: 400 }
      );
    }

    const image = await prisma.roomImage.create({
      data: {
        roomType: roomTypeValue as string,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, image }, { status: 201 });
  } catch (err) {
    console.error("POST error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// PUT update a room image entry (does not change the image file)
export async function PUT(req : NextRequest) {
  try {
    const body = await req.json();
    const { id, roomId, imageUrl } = body;

    const updated = await prisma.roomImage.update({
      where: { id },
      data: { id : roomId, imageUrl },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to update room image", error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE a room image
export async function DELETE(req : NextRequest) {
  try {
    const { id } = await req.json();

    const deleted = await prisma.roomImage.delete({ where: { id } });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error("DELETE error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to delete room image", error: errorMessage },
      { status: 500 }
    );
  }
}
