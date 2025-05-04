import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files",{
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    size: integer("size").notNull(),
    type: text("type").notNull(),

    // storage info
    fileUrl: text("file_url"),
    thumbnailUrl: text("thumbnail_url"),

    //Ownership info
    userId: text("user_id").notNull(),
    parentId: uuid("parent_id"), // Parent folder if (null for root)

    // file/folder flags
    isFolder: boolean("is_folder").notNull().default(false),
    isStarred: boolean("is_starred").notNull().default(false),
    isTrash: boolean("is_trash").notNull().default(false),

    // Timestamp
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

})

// parent: Each file/folder can have one parent folder

// children: Each folder can have many child files/folders


export const filesRelations = relations(files,({one,many}) => ({
    parent: one(files,{
        fields: [files.parentId],
        references: [files.id]
    }),

    // relationship to child file/folder
    children: many(files)
})) 

// Types of definitions

export const File = typeof files.$inferSelect
export const NewFile = typeof files.$inferInsert;