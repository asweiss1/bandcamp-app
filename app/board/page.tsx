import type { Metadata } from "next";
import { BoardBrowser } from "@/components/board-views";

export const metadata: Metadata = { title: "Musician board" };

export default function BoardPage() {
  return <BoardBrowser />;
}
