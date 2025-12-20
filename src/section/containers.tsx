import React from "react";
import { DockerContainerStatus, useStatus } from "../api/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_HOST } from "../api/config.";

function DockerContainer({
  name,
  id,
  image,
  running,
  host,
}: DockerContainerStatus & { host: string }) {
  return (
    <Card className="min-w-70 flex-1">
      <div className="px-4">
        <span className="overflow-hidden text-ellipsis inline-block w-[60%]">
          {name}
        </span>
        <Badge
          variant={running ? "default" : "destructive"}
          className="ml-2 float-right"
        >
          {running ? "Running" : "Stopped"}
        </Badge>
      </div>
      <CardContent>
        <div className="text-xs text-gray-500">{image}</div>
        <div className="text-xs text-gray-400">{host}</div>
        <div className="text-xs text-gray-300">{id}</div>
      </CardContent>
    </Card>
  );
}

export function DockerContainerList() {
  const [search, setSearch] = React.useState("");
  const media = useStatus(API_HOST);
  const node1 = useStatus("node1.local:18745");

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search containers..."
        className="w-full mb-4"
      />
      <div className="flex gap-4 flex-wrap">
        {[
          media.data?.docker.map((container) => ({
            ...container,
            host: media.data.network.hostname,
          })) ?? [],
          node1.data?.docker.map((container) => ({
            ...container,
            host: node1.data.network.hostname,
          })) ?? [],
        ]
          .flat()
          .sort((a, b) => Number(b.running) - Number(a.running))
          .filter(
            (container) =>
              container.name.toLowerCase().includes(search.toLowerCase()) ||
              container.image.toLowerCase().includes(search.toLowerCase()) ||
              container.id.toLowerCase().includes(search.toLowerCase())
          )
          .map((container) => (
            <DockerContainer key={container.id} {...container} />
          ))}
      </div>
    </div>
  );
}
