export type EnergySource = "Solar" | "Rede";
export type ConnectivityType = "Completa" | "Parcial";

export interface ExtraItem {
  componentId: string;
  qty: number;
}

export interface BridgeSpan {
  id: string;
  name: string;
  spanLength: number;
  spanCount: number;
  sensorCount: number;
  temperatureCount: number;
  energySource: EnergySource;
  solarKitCount: number;
  extraCableDistance: number;
  connectivity: ConnectivityType;
  connectivityKitCount: number;
  hasInfrastructure: boolean;
  hoursAdequation: number;
  hoursAssembly: number;
  extraItems: ExtraItem[];
}

export const createDefaultBridge = (): BridgeSpan => ({
  id: crypto.randomUUID(),
  name: "",
  spanLength: 0,
  spanCount: 1,
  sensorCount: 6,
  temperatureCount: 1,
  energySource: "Solar",
  solarKitCount: 1,
  extraCableDistance: 0,
  connectivity: "Completa",
  connectivityKitCount: 1,
  hasInfrastructure: true,
  hoursAdequation: 30,
  hoursAssembly: 10,
  extraItems: [],
});
