import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the uploads directory exists
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



export async function POST(req: NextRequest) {
  try {
    await ensureUploadDirExists();

    const formData = await req.formData();

    const identityNumber = formData.get("identityNumber") as string;
    

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        
          identityNumber: identityNumber.trim() 
          
        
      },
    });

    if (existingCustomer) {
      if (!existingCustomer.isActive) {
        // Customer is banned/inactive
        return NextResponse.json(
          {
            success: false,
            message: "This customer is banned and cannot be registered.",
          },
          { status: 403 }
        );
      } else {
        // Customer already exists and is active
        return NextResponse.json(
          {
            success: false,
            message: "Customer with this identity or phone already exists.",
          },
          { status: 409 }
        );
      }
    }

    const frontIdUrl = await saveFile("frontSideImage", formData);
    const backIdUrl = await saveFile("backSideImage", formData);
    const guestImageUrl = await saveFile("guestImage", formData);

    const customer = await prisma.customer.create({
      data: {
        customerID: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
        phone: formData.get("mobile") as string,
        contactType: formData.get("contactType") as string,
        country: formData.get("country") as string,
        state: formData.get("state") as string,
        city: formData.get("city") as string,
        zipcode: formData.get("zipcode") as string,
        address: formData.get("address") as string,
        identityType: formData.get("identityType") as string,
        identityNumber: identityNumber,
        frontIdUrl,
        backIdUrl,
        guestImageUrl,
        isActive: true, // default active
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


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile");

    // Validate mobile input
    if (!mobile || mobile.trim() === "") {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    // Look for the customer with matching identity number AND active status
    const customer = await prisma.customer.findFirst({
      where: {
        identityNumber: mobile.trim(),
        isActive: true,
      },
    });

    // If no active customer found
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found or inactive" },
        { status: 404 }
      );
    }

    // Return found customer
    return NextResponse.json({ customer });
  } catch (err: any) {
    console.error("Error searching customer:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}