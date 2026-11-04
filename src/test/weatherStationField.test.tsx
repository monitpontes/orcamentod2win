import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BridgeConfig from "../components/BridgeConfig";
import { createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";

describe("campo de estações meteorológicas", () => {
  it("permite definir zero ou mais estações por ponte sem alterar sensores de temperatura", () => {
    function Harness() {
      const [bridges, setBridges] = useState([{ ...createDefaultBridge(), name: "Ponte A", temperatureCount: 4 }]);
      return <><BridgeConfig bridges={bridges} onUpdate={setBridges} components={defaultComponents} /><output data-testid="temperature-count">{bridges[0].temperatureCount}</output></>;
    }
    render(<Harness />);
    const stations = screen.getByRole("spinbutton", { name: "Estações meteorológicas de Ponte A" });
    expect(stations).toHaveValue(0);
    fireEvent.change(stations, { target: { value: "2" } });
    expect(stations).toHaveValue(2);
    expect(screen.getByTestId("temperature-count")).toHaveTextContent("4");
  });
});
