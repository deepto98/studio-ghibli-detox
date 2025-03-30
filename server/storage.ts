// import { 
//     users, type User, type InsertUser,
//     images, type Image, type InsertImage
//   } from "@shared/schema";
//   import { database } from "./db";

// export interface IStorage {
//   getUser(id: number): Promise<User | undefined>;
//   getUserByUsername(username: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;
//   saveImage(image: InsertImage): Promise<Image>;
//   getImage(id: number): Promise<Image | undefined>;
//   getUserImages(userId: number): Promise<Image[]>;
//   getAllImages(): Promise<Image[]>;
//   getAllPublicImages(): Promise<Image[]>;
// }

// export class DbStorage implements IStorage {
//     async getUser(id: number): Promise<User | undefined> {
//       return await database.getUser(id);
//     }
  
//     async getUserByUsername(username: string): Promise<User | undefined> {
//       return await database.getUserByUsername(username);
//     }
  
//     async createUser(user: InsertUser): Promise<User> {
//       return await database.createUser(user);
//     }
  
//     async saveImage(image: InsertImage): Promise<Image> {
//       return await database.saveImage(image);
//     }
  
//     async getImage(id: number): Promise<Image | undefined> {
//       return await database.getImage(id);
//     }
  
//     async getUserImages(userId: number): Promise<Image[]> {
//       return await database.getUserImages(userId);
//     }
  
//     async getAllImages(): Promise<Image[]> {
//       return await database.getAllImages();
//     }
    
//     async getAllPublicImages(): Promise<Image[]> {
//       return await database.getAllPublicImages();
//     }
//   }
  
// // export class MemStorage implements IStorage {
// //     private users: Map<number, User>;
// //     private images: Map<number, Image>;
// //     userCurrentId: number;
// //     imageCurrentId: number;

// //     constructor() {
// //         this.users = new Map();
// //         this.images = new Map();
// //         this.userCurrentId = 1;
// //         this.imageCurrentId = 1;
// //     }

// //     async getUser(id: number): Promise<User | undefined> {
// //         return this.users.get(id);
// //     }

// //     async getUserByUsername(username: string): Promise<User | undefined> {
// //         return Array.from(this.users.values()).find(
// //             (user) => user.username === username,
// //         );
// //     }

// //     async createUser(insertUser: InsertUser): Promise<User> {
// //         const id = this.userCurrentId++;
// //         const user: User = { ...insertUser, id };
// //         this.users.set(id, user);
// //         return user;
// //     }

// //     async saveImage(insertImage: InsertImage): Promise<Image> {
// //         const id = this.imageCurrentId++;
// //         // Ensure all nullable fields are explicitly set to null if undefined
// //         const image: Image = {
// //             id,
// //             originalImageUrl: insertImage.originalImageUrl ?? null,
// //             detoxifiedImageUrl: insertImage.detoxifiedImageUrl ?? null,
// //             diagnosisPoints: insertImage.diagnosisPoints ?? [],
// //             treatmentPoints: insertImage.treatmentPoints ?? [],
// //             contaminationLevel: insertImage.contaminationLevel ?? 0,
// //             userId: insertImage.userId ?? null,
// //             shareableUrl: `/deghib/${id}` // Set the shareable URL with the actual ID
// //         };
// //         this.images.set(id, image);
// //         return image;
// //     }

// //     async getImage(id: number): Promise<Image | undefined> {
// //         return this.images.get(id);
// //     }

// //     async getUserImages(userId: number): Promise<Image[]> {
// //         return Array.from(this.images.values()).filter(
// //             (image) => image.userId === userId
// //         );
// //     }

// //     async getAllImages(): Promise<Image[]> {
// //         // Return all images sorted by id in descending order (newest first)
// //         return Array.from(this.images.values()).sort((a, b) => b.id - a.id);
// //     }
// // }

// export const storage = new DbStorage();