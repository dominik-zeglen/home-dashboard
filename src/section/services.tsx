import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader,
  Pin,
  RefreshCcw,
} from "lucide-react";
import {
  SystemdUnit,
  usePinService,
  useAllSystemdUnits,
  useUnpinService,
  usePinnedServices,
  useAllSystemdUnitsBust,
} from "../api/service";
import { useDevices } from "../api/devices";
import { API_HOST } from "../api/config.";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "failed", label: "Failed" },
];

const pageSize = 10;

function Unit({
  name,
  state,
  host,
  sub_state,
  description,
  pinned,
  onPin,
}: SystemdUnit & { host: string; pinned: boolean; onPin: () => void }) {
  return (
    <>
      <span className="overflow-hidden text-ellipsis text-nowrap font-mono">
        {name}
      </span>
      <Badge
        variant={
          state === "active"
            ? "default"
            : state === "failed"
              ? "destructive"
              : "secondary"
        }
        className="justify-self-center"
      >
        {sub_state}
      </Badge>
      <span>{host}</span>
      <span className="text-muted-foreground overflow-hidden text-ellipsis text-nowrap">
        {description}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onPin}
        title={pinned ? "Unpin" : "Pin"}
      >
        <Pin className={`h-3 w-3 ${pinned ? "fill-current" : ""}`} />
      </Button>
    </>
  );
}

function isPinned(
  unit: SystemdUnit & { host: string },
  pinnedServices: { host: string; name: string }[] | undefined,
) {
  return !!pinnedServices?.some(
    ({ host, name }) => host === unit.host && name === unit.name,
  );
}

export function Services() {
  const [open, setOpen] = React.useState(true);
  const [tab, setTab] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { mutate: pinService } = usePinService();
  const { mutate: unpinService } = useUnpinService();
  const { data: devices } = useDevices();
  const { data: pinnedServices } = usePinnedServices();
  const { data: services, isLoading } = useAllSystemdUnits();
  const { refetch: refetchServices, isRefetching } = useAllSystemdUnitsBust();

  React.useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const filteredServices = React.useMemo(() => {
    if (!services) return [];

    return services
      .filter((unit) => {
        if (tab !== "all" && unit.state !== tab) {
          return false;
        }
        if (search && !unit.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        isPinned(a, pinnedServices) === isPinned(b, pinnedServices)
          ? a.name.localeCompare(b.name)
          : isPinned(a, pinnedServices)
            ? -1
            : 1,
      );
  }, [services, tab, search, devices, pinnedServices]);
  const pages = Math.ceil(filteredServices.length / pageSize);
  const displayedUnits = filteredServices.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between">
        <CardTitle>Systemd Services</CardTitle>
        <div className="flex gap-4 relative left-2 bottom-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => refetchServices({})}
          >
            <RefreshCcw />
          </Button>
          <Button size="icon" variant="outline" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <>
          <CardContent className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <Button
                key={t.value}
                variant={tab === t.value ? "default" : "outline"}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </Button>
            ))}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-48 ml-auto"
            />
          </CardContent>
          <CardContent className="grid gap-2 grid-cols-[1fr_80px_1fr_2fr_28px] items-center text-xs">
            <span className="text-muted-foreground font-medium">Unit</span>
            <span className="text-muted-foreground font-medium text-center">
              State
            </span>
            <span className="text-muted-foreground font-medium">Host</span>
            <span className="text-muted-foreground font-medium">
              Description
            </span>
            <span />
            {isLoading || isRefetching ? (
              <span className="col-span-5 text-muted-foreground py-4">
                <Loader className="animate-spin mx-auto" />
              </span>
            ) : displayedUnits.length === 0 ? (
              <span className="col-span-5 text-muted-foreground">
                No services found
              </span>
            ) : (
              displayedUnits.map((unit) => (
                <Unit
                  key={unit.name + unit.host}
                  {...unit}
                  pinned={isPinned(unit, pinnedServices)}
                  onPin={() =>
                    (isPinned(unit, pinnedServices)
                      ? unpinService
                      : pinService)({
                      name: unit.name,
                      host: unit.host,
                    })
                  }
                />
              ))
            )}
          </CardContent>
          {!!services && pages > 1 && (
            <CardContent className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </CardContent>
          )}
        </>
      )}
    </Card>
  );
}
