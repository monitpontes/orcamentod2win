export type EnergySource = "Solar" | "Rede";
export type ConnectivityType = "Completa" | "Parcial";

export interface BridgeSpan {
  id: string;
  name: string;
  spanLength: number;
  spanCount: number;
  sensorCount: number;
  temperatureCount: number;
  energySource: EnergySource;
  extraCableDistance: number;
  connectivity: ConnectivityType;
  hasInfrastructure: boolean;
  hoursAdequation: number;
  hoursAssembly: number;
}

export const createDefaultBridge = (): BridgeSpan => ({
  id: crypto.randomUUID(),
  name: "",
  spanLength: 0,
  spanCount: 1,
  sensorCount: 6,
  temperatureCount: 1,
  energySource: "Solar",
  extraCableDistance: 0,
  connectivity: "Completa",
  hasInfrastructure: true,
  hoursAdequation: 30,
  hoursAssembly: 10,
});
