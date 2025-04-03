import React from "react";
import {
  Center,
  Container,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNodeInfo } from "../context";
import { FaTemperatureEmpty } from "react-icons/fa6";

const unitsToExponent: Record<string, number> = {
  B: 0,
  K: 3,
  M: 6,
  G: 9,
  T: 12,
};

function getNumberFromUnit(str: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, value, unit] = str.match(/(\d+(?:\.\d+)?)([A-Z])i?/) ?? [];
  if (!value || !unit) {
    return 0;
  }

  return parseFloat(value) * 10 ** unitsToExponent[unit];
}

function getTemperatureColor(temperature: number) {
  return temperature < 60 ? "green" : temperature > 80 ? "red" : "yellow";
}

const colors = [
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
];

export const Device: React.FC = () => {
  const info = useNodeInfo();

  if (!info) {
    return (
      <Container my="md">
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Skeleton height={24} />
        </SimpleGrid>
      </Container>
    );
  }

  const ram = {
    used: getNumberFromUnit(info.ram[1]),
    available: getNumberFromUnit(info.ram[2]),
    total: getNumberFromUnit(info.ram[0]),
  };

  return (
    <Container my="md">
      <SimpleGrid cols={{ base: 1, md: 4 }}>
        <Paper withBorder p={10}>
          <Center>
            <RingProgress
              size={140}
              thickness={6}
              roundCaps
              sections={Object.entries(info.cpu)
                .filter(([name]) => name !== "all")
                .map(([, load], index) => ({
                  value: load / (Object.keys(info.cpu).length - 1),
                  color: colors[index],
                }))}
              label={
                <Text ta="center" size="xl">
                  {info.cpu.all.toFixed(2)}%
                </Text>
              }
            />
          </Center>
          <Title order={4} ta="center">
            CPU
          </Title>
        </Paper>
        <Paper withBorder p={10}>
          <Center>
            <RingProgress
              size={140}
              thickness={6}
              roundCaps
              sections={[
                {
                  value: (ram.used / ram.total) * 100,
                  color: "blue",
                },
                {
                  value: (ram.available / ram.total) * 100,
                  color: "green",
                },
              ]}
              label={
                <Text ta="center" size="xl">
                  {((ram.used / ram.total) * 100).toFixed(2)}%
                </Text>
              }
            />
          </Center>
          <Title order={4} ta="center">
            RAM
          </Title>
        </Paper>
        <Paper
          withBorder
          p={10}
          component={Stack}
          justify="space-between"
          bg={`linear-gradient(45deg, var(--mantine-color-${getTemperatureColor(info.temperature)}-7) 0%, var(--mantine-color-${getTemperatureColor(info.temperature)}-3) 100%)`}
          c="white"
        >
          <Center p={10}>
            <Group mt="lg">
              <FaTemperatureEmpty size={60} />
              <Title ta="center" fz="h2" component="span">
                {info.temperature}°C
              </Title>
            </Group>
          </Center>
          <Title order={4} ta="center">
            Temperature
          </Title>
        </Paper>
        {Object.entries(info.disk).map(([name, disk]) => (
          <Paper withBorder p={10}>
            <Center>
              <RingProgress
                size={140}
                thickness={6}
                roundCaps
                sections={[
                  {
                    value: Number(disk.percent.replace("%", "")),
                    color: "blue",
                  },
                ]}
                label={
                  <Text ta="center" size="sm">
                    {disk.available}B / {disk.size}B
                  </Text>
                }
              />
            </Center>
            <Title order={4} ta="center">
              {name}
            </Title>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  );
};
