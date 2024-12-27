export interface JobPost {
  name: string;
  url: string;
  posted: string;
  desc: string;
  type: string;
  budget: string;
  postedDate?: Date | null;
}
