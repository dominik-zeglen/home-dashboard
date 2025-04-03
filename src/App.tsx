import "@mantine/core/styles.css";
import "./App.css";

import React from "react";
import { useApi } from "./hooks/useApi";
import { NodeContext, NodeInfo } from "./context";
import {
  Container,
  createTheme,
  Flex,
  Group,
  MantineColorsTuple,
  MantineProvider,
  Skeleton,
  Title,
} from "@mantine/core";
import { Services } from "./sections/Services";
import { FiTerminal } from "react-icons/fi";
import { Networking } from "./sections/Networking";
import { Device } from "./sections/Device";

const blue: MantineColorsTuple = [
  "#e9f3ff",
  "#d6e3fb",
  "#adc3ef",
  "#81a2e3",
  "#5c86d8",
  "#4474d3",
  "#366bd1",
  "#275aba",
  "#1e50a7",
  "#0b4595",
];

const theme = createTheme({
  colors: {
    blue,
  },
  primaryColor: "blue",
  primaryShade: 6,
});

export const App: React.FC = () => {
  // const {data,error} = useApi<NodeInfo>("/status");
  const { data, error } = useApi<NodeInfo>("http://media.local:8080/status");

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <MantineProvider theme={theme}>
      <NodeContext value={data}>
        <header className="header">
          <Container size="md">
            <Flex justify="space-between" align="center">
              <Group>
                <FiTerminal className="header-icon" size={34} />
                <Title order={1}>
                  {data?.hostname?.toLocaleUpperCase() ?? (
                    <Skeleton width="100px" height="16px" />
                  )}
                </Title>
              </Group>
              <div>
                {data?.uptime ?? <Skeleton width="100px" height="16px" />}
              </div>
            </Flex>
          </Container>
        </header>
        <Container size="md">
          <Title order={3} ta="center">
            Device
          </Title>
          <Device />
          <Title order={3} ta="center">
            Services
          </Title>
          <Services />
          <Title order={3} ta="center">
            Networking
          </Title>
          <Networking />
        </Container>
      </NodeContext>
    </MantineProvider>
  );
};

export default App;
