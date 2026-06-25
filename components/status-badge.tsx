import { Badge } from "@/components/ui/badge";
import type { RoomStatus } from "@/lib/types/database";

const LABEL: Record<RoomStatus, string> = {
  VC: "Vacant Clean",
  VD: "Vacant Dirty",
  OC: "Occupied Clean",
  OOO: "Out of Order",
};

export function StatusBadge({ status }: { status: RoomStatus }) {
  return <Badge variant="outline">{LABEL[status]}</Badge>;
}
