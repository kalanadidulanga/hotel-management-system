import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { writeFile } from "fs/promises";
import prisma from "@/lib/db";


export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper: parse multipart/form-data
async function parseFormData(req: NextRequest) {
  const boundary = req.headers.get("content-type")?.split("boundary=")[1];
  if (!boundary) throw new Error("No boundary in content-type");

  const formData = await req.formData();
  return formData;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Save files and return paths
    async function saveFile(fieldName: string) {
      const file = formData.get(fieldName) as File;
      if (!file || file.size === 0) return null;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      await writeFile(filePath, buffer);
      return `/uploads/${fileName}`;
    }

    const frontIdUrl = await saveFile("frontSideImage");
    const backIdUrl = await saveFile("backSideImage");
    const guestImageUrl = await saveFile("guestImage");

    const customer = await prisma.customer.create({
      data: {
        title: formData.get("title") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        gender: formData.get("gender") as string,
        dateOfBirth: new Date(formData.get("dateOfBirth") as string),
        anniversary: formData.get("anniversary")
          ? new Date(formData.get("anniversary") as string)
          : undefined,
        nationality: formData.get("nationality") as any,
        isVip: formData.get("isVip") === "true",
        occupation: formData.get("occupation") as string,
        email: formData.get("email") as string,
        countryCode: formData.get("countryCode") as string,
        phone: formData.get("mobile") as string,
        contactType: formData.get("contactType") as string,
        country: formData.get("country") as string,
        state: formData.get("state") as string,
        city: formData.get("city") as string,
        zipcode: formData.get("zipcode") as string,
        address: formData.get("address") as string,
        identityType: formData.get("identityType") as string,
        identityNumber: formData.get("identityNumber") as string,
        frontIdUrl,
        backIdUrl,
        guestImageUrl,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
