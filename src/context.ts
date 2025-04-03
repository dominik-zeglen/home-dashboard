import React from "react";

export interface NodeInfo {
  ram: [string, string, string];
  cpu: {
    all: number;
    [key: `core${number}`]: number;
  };
  disk: Record<
    string,
    Record<"available" | "mount" | "percent" | "size" | "used", string>
  >;
  services: Record<string, { status: boolean; url: string | null }>;
  hostname: string;
  external_ip: string;
  local_ip: string[];
  ssh_tunnels: Record<number, boolean>;
  uptime: string;
  temperature: number;
}

export const NodeContext = React.createContext<NodeInfo | undefined>(undefined);
export const useNodeInfo = () => React.useContext(NodeContext);
