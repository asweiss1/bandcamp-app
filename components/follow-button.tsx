"use client";

import { toast } from "sonner";
import { followerCount, isFollowing } from "@/lib/fans";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function FollowButton({
  targetId,
  targetRole,
}: {
  targetId: string;
  targetRole: "band" | "venue";
}) {
  const { snapshot, follow, unfollow } = useApp();
  const count = followerCount(snapshot.follows, targetId);
  const fanId = snapshot.role === "fan" ? snapshot.fanId : null;
  const on = fanId ? isFollowing(snapshot.follows, fanId, targetId) : false;

  function toggle() {
    if (!fanId) {
      toast.message("Switch to a fan profile to follow.");
      return;
    }
    const result = on ? unfollow(targetId) : follow(targetId, targetRole);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button type="button" variant={on ? "secondary" : "default"} className="h-10" onClick={toggle}>
        {on ? "Following" : "Follow"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? "follower" : "followers"}
      </p>
    </div>
  );
}
