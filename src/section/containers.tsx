import React from "react";
import { DockerContainerStatus, useStatus } from "../api/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_HOST } from "../api/config.";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader,
  Play,
  RefreshCw,
  Square,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContainerAction, useContainers } from "../api/docker";
import { useDevices } from "../api/devices";

function DockerContainer({
  name,
  id,
  image,
  running,
  host,
}: DockerContainerStatus & { host: string }) {
  const { mutate, isPending } = useContainerAction();

  return (
    <>
      <span className="overflow-hidden text-ellipsis text-nowrap">{name}</span>
      <Badge
        variant={running ? "default" : "destructive"}
        className="justify-self-center"
      >
        {running ? <CheckCircle2 /> : <XCircle />}
      </Badge>
      <span className="text-xs overflow-hidden text-ellipsis text-nowrap">
        {image}
      </span>
      <span className="text-xs text-muted-foreground">{id.slice(0, 12)}</span>
      <div className="flex gap-1 justify-end">
        {isPending ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : running ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => mutate({ host, containerId: id, action: "stop" })}
              title="Stop"
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                mutate({ host, containerId: id, action: "restart" })
              }
              title="Restart"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => mutate({ host, containerId: id, action: "start" })}
            title="Start"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>
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
          <CardContent className="grid gap-2 grid-cols-[200px_40px_3fr_100px_70px] items-center">
            <span className="text-xs text-muted-foreground font-medium">
              Name
            </span>
            <span className="text-xs text-muted-foreground font-medium text-center">
              Status
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Image
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              ID
            </span>
            <span className="text-xs text-muted-foreground font-medium text-right">
              Actions
            </span>
            {containers
              .flatMap(({ data }, idx) =>
                (data?.docker ?? []).map((container) => ({
                  ...container,
                  host: idx === 0 ? API_HOST : devices![idx - 1].hostname,
                })),
              )
              .sort((a, b) => Number(b.running) - Number(a.running))
              .filter((container) =>
                [
                  container.name.toLowerCase(),
                  container.image.toLowerCase(),
                  container.id.toLowerCase(),
                ]
                  .join("\0\0")
                  .includes(search.toLowerCase()),
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
