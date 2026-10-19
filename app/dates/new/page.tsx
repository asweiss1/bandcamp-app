import type { Metadata } from "next";
import { PostDateForm } from "@/components/post-date-form";

export const metadata: Metadata = { title: "Post a date" };

export default function NewDatePage() {
  return <PostDateForm />;
}
