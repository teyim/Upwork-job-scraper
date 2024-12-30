import { ObjectId } from "mongodb";

export interface JobPost {
  _id: ObjectId;
  name: string;
  url: string;
  posted: string;
  desc: string;
  type: string;
  budget: string;
  postedDate: Date | null;
  sentToTelegram: boolean; // Add this field
  createdAt: Date | null;
}
