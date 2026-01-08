import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatus } from "../api/status";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDeleteDevice, useDevices, usePutDevice } from "../api/devices";
import { API_HOST } from "../api/config.";

type HardwareProps = {
  hostname: string;
};

function Bar({ className, value }: { className?: string; value: number }) {
  return (
    <div
      className={clsx(
        className,
        "h-1 bg-primary rounded w-full transition-all min-w-[0.05rem]",
      )}
      style={{ maxWidth: `${value}%` }}
    />
  );
}

export function Hardware({ hostname }: HardwareProps) {
  const { data } = useStatus(hostname);
  const { mutate: deleteDevice, isPending } = useDeleteDevice();
  const { data: devices } = useDevices();

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{data?.network.hostname}</CardTitle>
          {hostname !== API_HOST && (
            <Button
              className="relative bottom-1 left-1"
              variant="outline"
              color="destructive"
              onClick={() =>
                deleteDevice(
                  devices!.find(({ hostname: h }) => h === hostname)!.id,
                )
              }
            >
              {isPending ? <Loader className="animate-spin" /> : <Trash />}
            </Button>
          )}
        </div>
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
              {Object.entries(data.hardware.cpu_idle_percentages)
                .filter(([key]) => key !== "all")
                .map(([key, value]) => (
                  <Bar key={key} value={value as number} />
                ))}
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
              {data.network.local_ip.map(({ address, device }) => (
                <div key={address}>
                  <span>{address}</span>
                  <span className="ml-2">{device}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AddDevice() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    hostname: "",
  });
  const { mutate: putDevice, isPending } = usePutDevice();
  const submit = (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    putDevice({ hostname: form.hostname });
    setForm({ hostname: "" });
    setOpen(false);
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="float-right">
          <Plus /> Add Device
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Input
            value={form.hostname}
            onChange={(e) => setForm({ ...form, hostname: e.target.value })}
            placeholder="device.local:18745"
          />
        </DialogDescription>
        <DialogFooter>
          <Button type="submit" onClick={submit}>
            {isPending ? <Loader className="animate-spin" /> : "Add Device"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
