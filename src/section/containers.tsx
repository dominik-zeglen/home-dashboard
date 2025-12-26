import React from "react";
import { DockerContainerStatus, useStatus } from "../api/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_HOST } from "../api/config.";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContainers } from "../api/docker";
import { useDevices } from "../api/devices";

function DockerContainer({
  name,
  id,
  image,
  running,
  host,
}: DockerContainerStatus & { host: string }) {
  return (
    <>
      <span className="overflow-hidden text-ellipsis">{name}</span>
      <Badge
        variant={running ? "default" : "destructive"}
        className="ml-2 float-right"
      >
        {running ? (
          <>
            <CheckCircle2 /> OK
          </>
        ) : (
          <>
            <XCircle /> Problem
          </>
        )}
      </Badge>
      <div className="text-xs overflow-hidden text-ellipsis text-nowrap">
        {image}
      </div>
      <div className="text-xs">{host}</div>
      <div className="text-xs text-right">{id}</div>
    </>
  );
}

export function DockerContainerList() {
  const [open, setOpen] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const { data: devices } = useDevices();
  const containers = useContainers();

  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between">
        <CardTitle>Containers</CardTitle>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="relative left-2 bottom-2"
        >
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </CardHeader>
      {open && (
        <>
          <CardContent>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search containers..."
              className="w-full"
            />
          </CardContent>
          <CardContent className="grid gap-2 grid-cols-[200px_80px_3fr_1fr_1fr]">
            {containers
              .flatMap(({ data }, idx) =>
                (data?.docker ?? []).map((container) => ({
                  ...container,
                  host: idx === 0 ? API_HOST : devices![idx - 1].hostname,
                }))
              )
              .sort((a, b) => Number(b.running) - Number(a.running))
              .filter(
                (container) =>
                  container.name.toLowerCase().includes(search.toLowerCase()) ||
                  container.image
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                  container.id.toLowerCase().includes(search.toLowerCase())
              )
              .map((container) => (
                <DockerContainer key={container.id} {...container} />
              ))}
          </CardContent>
        </>
      )}
    </Card>
  );
}
