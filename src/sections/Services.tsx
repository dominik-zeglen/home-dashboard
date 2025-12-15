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
import { TbBrandMinecraft, TbQuestionMark } from "react-icons/tb";
import { IconType } from "react-icons";
import { SiTransmission } from "react-icons/si";
import { IoIosCloudDownload } from "react-icons/io";
import { TbBrandOpenvpn } from "react-icons/tb";
import { FaExternalLinkAlt } from "react-icons/fa";

const serviceIcons: Record<string, IconType> = {
  Minecraft: TbBrandMinecraft,
  Transmission: SiTransmission,
  Updog: IoIosCloudDownload,
  VPN: TbBrandOpenvpn,
};

export const Services: React.FC = () => {
  const info = useNodeInfo();

  return (
    <Container my="md">
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        {info ? (
          Object.entries(info.services).map(([name, { status, url }]) => {
            const Icon = serviceIcons[name];

            return (
              <Paper withBorder p={10}>
                <Group>
                  {!!Icon ? <Icon size={48} /> : <TbQuestionMark size={48} />}
                  <div>
                    <Title order={4}>{name}</Title>
                    {status ? (
                      <div>
                        <Dot color="var(--mantine-color-green-6)" />
                        <Text c="dimmed" component="span" size="sm">
                          Running
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Dot color="var(--mantine-color-red-6)" />
                        <Text c="dimmed" component="span" size="sm">
                          Stopped
                        </Text>
                      </div>
                    )}
                  </div>
                  {!!url && (
                    <Text
                      component="a"
                      href={url}
                      target="_blank"
                      className="iconLink"
                    >
                      <FaExternalLinkAlt size={24} />
                    </Text>
                  )}
                </Group>
              </Paper>
            );
          })
        ) : (
          <Skeleton height={16} />
        )}
      </SimpleGrid>
    </Container>
  );
};
