import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
  });

// image kit credentials
export async function POST(request: NextRequest){
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Parse the form data
        const formData = await request.formData();

        const file = formData.get("file") as File;
        const formUserId = formData.get("userId") as string;
        const parentId = formData.get("parentId") as string || null;


        if(formUserId !== userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if(!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if(parentId){
            const [parentFolder] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id,parentId),
                    eq(files.userId, userId),
                    eq(files.isFolder, true),
                )
            )

            if (!parentFolder) {
                return NextResponse.json(
                  { error: "Parent folder not found" },
                  { status: 404 }
                );
        }
    }

        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            return NextResponse.json(
              { error: "Only image files are supported" },
              { status: 400 }
            );
          }
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const folderPath = parentId ? `/droply/${userId}/folder/${parentId}` : `/droply/${userId}`;
    const originalFilename = file.name;
    const fileExtension = originalFilename.split(".").pop() || "";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: uniqueFileName,
        folder: folderPath,
        useUniqueFileName: false,
    });

    const fileData = {
        name: originalFilename,
        path: uploadResponse.filePath,
        size: file.size,
        type: file.type,
        fileUrl: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl || null,
        userId: userId,
        parentId: parentId,
        isFolder: false,
        isStarred: false,
        isTrash: false,
    }

    const [newFile] = await db.insert(files).values(fileData).returning();
        
    return NextResponse.json(newFile, { status: 200 });
    } catch (error) {
        console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
    }
}