export * from "./hostel-data-provider.interface";
export * from "./simulated-hostel-provider";

import { simulatedHostelMealDataProvider } from "./simulated-hostel-provider";
import { IHostelMealDataProvider } from "./hostel-data-provider.interface";

/**
 * Authoritative hostel meal data provider singleton.
 * Currently backed by SimulatedHostelMealDataProvider (synthetic PostgreSQL dataset).
 * In production, this can be swapped with a real API adapter without modifying downstream logic.
 */
export const hostelDataProvider: IHostelMealDataProvider = simulatedHostelMealDataProvider;
