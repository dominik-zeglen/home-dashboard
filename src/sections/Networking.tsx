import React from "react";
import {
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { useNodeInfo } from "../context";
import { Dot } from "../components/Dot";
import { FaNetworkWired } from "react-icons/fa";
import { TbNetwork } from "react-icons/tb";

export const Networking: React.FC = () => {
  const info = useNodeInfo();

  return (
    <Container my="md">
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        {info ? (
          <>
            {info.local_ip.map((ip) => (
              <Paper withBorder p={10}>
                <Group>
                  <FaNetworkWired size={48} />
                  <div>
                    <Title order={4}>Local IP</Title>
                    <Text c="dimmed">{ip}</Text>
                  </div>
                </Group>
              </Paper>
            ))}
            <Paper withBorder p={10}>
              <Group>
                <TbNetwork size={48} />
                <div>
                  <Title order={4}>External IP</Title>
                  <Text c="dimmed">{info.external_ip}</Text>
                </div>
              </Group>
            </Paper>
            {Object.entries(info.ssh_tunnels).map(([name, status]) => (
              <Paper withBorder p={10}>
                <Group justify="space-between">
                  <div>
                    <Title order={4}>Tunnel {name}</Title>
                    {status ? (
                      <div>
                        <Dot color="var(--mantine-color-green-6)" />
                        <Text c="dimmed" component="span" size="sm">
                          Open
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Dot color="var(--mantine-color-red-6)" />
                        <Text c="dimmed" component="span" size="sm">
                          Closed
                        </Text>
                      </div>
                    )}
                  </div>
                  {/* <Switch checked={status} onChange={() => {}} /> */}
                </Group>
              </Paper>
            ))}
          </>
        ) : (
          <Skeleton height={16} />
        )}
      </SimpleGrid>
    </Container>
  );
};
