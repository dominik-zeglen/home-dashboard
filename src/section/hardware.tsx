import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatus } from "../api/status";
import clsx from "clsx";

type HardwareProps = {
  hostname: string;
};

function Bar({ className, value }: { className?: string; value: number }) {
  return (
    <div
      className={clsx(
        className,
        "h-1 bg-primary rounded w-full transition-all min-w-[0.05rem]"
      )}
      style={{ maxWidth: `${value}%` }}
    />
  );
}

export function Hardware({ hostname }: HardwareProps) {
  const { data } = useStatus(hostname);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{data?.network.hostname}</CardTitle>
        <div className="text-xs text-muted-foreground">
          {data?.hardware.uptime}
        </div>
      </CardHeader>
      <CardContent>
        {!!data?.hardware && (
          <>
            <div className="mb-4">
              <span className="mb-1">Temperature</span>
              <div className={`text-xs float-right`}>
                {data.hardware.temperature} °C
              </div>
            </div>

            <div className="mb-1">
              CPU ({data.hardware.cpu_idle_percentages.all?.toFixed(1)}%)
            </div>
            <div className="grid gap-1 mb-4">
              <Bar value={data.hardware.cpu_idle_percentages.core0} />
              <Bar value={data.hardware.cpu_idle_percentages.core1} />
              <Bar value={data.hardware.cpu_idle_percentages.core2} />
              <Bar value={data.hardware.cpu_idle_percentages.core3} />
            </div>

            <div className="mb-4">
              <div>RAM</div>
              <div className="text-xs text-muted-foreground">
                {data.hardware.ram[1]} used / {data.hardware.ram[0]} total
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-1">Storage</div>
              {Object.entries(data.hardware.disk).map(([name, disk]) => (
                <div className="mb-2 text-muted-foreground" key={name}>
                  <div className="text-xs">
                    <span>{name}</span>
                    <span className="float-right">
                      {disk.used} / {disk.size}
                    </span>
                  </div>
                  <Bar value={parseFloat(disk.percent)} />
                </div>
              ))}
            </div>

            <div className="text-muted-foreground">
              <div className="mb-1 text-foreground">Network</div>
              <div>
                <span>{data.network.external_ip}</span>
                <span className="ml-2">external</span>
              </div>
              {data.network.local_ip.map((ip) => (
                <div>
                  <span>{ip}</span>
                  <span className="ml-2">local</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
