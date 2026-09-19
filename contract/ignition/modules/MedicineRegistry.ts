import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// The regulator defaults to the deploying account. Override on a real network with
// a parameters file: { "MedicineRegistryModule": { "regulator": "0x..." } }
export default buildModule("MedicineRegistryModule", (m) => {
  const regulator = m.getParameter("regulator", m.getAccount(0));
  const registry = m.contract("MedicineRegistry", [regulator]);

  return { registry };
});
