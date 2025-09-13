import { describe, it, expect, beforeEach } from "vitest";
import { bufferCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TOTAL_TOKENS = 101;
const ERR_INVALID_LEGAL_HASH = 102;
const ERR_INVALID_LOCATION = 103;
const ERR_INVALID_DESCRIPTION = 104;
const ERR_INVALID_VALUE = 105;
const ERR_PROPERTY_ALREADY_EXISTS = 106;
const ERR_PROPERTY_NOT_FOUND = 107;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INVALID_CURRENCY = 110;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_MAX_PROPERTIES_EXCEEDED = 114;
const ERR_INVALID_PROPERTY_TYPE = 115;
const ERR_INVALID_CAPACITY = 116;
const ERR_INVALID_AMENITIES = 117;

interface Property {
  owner: string;
  location: string;
  description: string;
  legalHash: Uint8Array;
  totalTokens: number;
  timestamp: number;
  value: number;
  currency: string;
  status: boolean;
  propertyType: string;
  capacity: number;
  amenities: string;
}

interface PropertyUpdate {
  updateLocation: string;
  updateDescription: string;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class PropertyRegistryMock {
  state: {
    nextPropertyId: number;
    maxProperties: number;
    registrationFee: number;
    authorityContract: string | null;
    properties: Map<number, Property>;
    propertyUpdates: Map<number, PropertyUpdate>;
    propertiesByLocation: Map<string, number>;
  } = {
    nextPropertyId: 0,
    maxProperties: 1000,
    registrationFee: 1000,
    authorityContract: null,
    properties: new Map(),
    propertyUpdates: new Map(),
    propertiesByLocation: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextPropertyId: 0,
      maxProperties: 1000,
      registrationFee: 1000,
      authorityContract: null,
      properties: new Map(),
      propertyUpdates: new Map(),
      propertiesByLocation: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setRegistrationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.registrationFee = newFee;
    return { ok: true, value: true };
  }

  registerProperty(
    location: string,
    description: string,
    legalHash: Uint8Array,
    totalTokens: number,
    value: number,
    currency: string,
    propertyType: string,
    capacity: number,
    amenities: string
  ): Result<number> {
    if (this.state.nextPropertyId >= this.state.maxProperties) return { ok: false, value: ERR_MAX_PROPERTIES_EXCEEDED };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!description || description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (legalHash.length !== 32) return { ok: false, value: ERR_INVALID_LEGAL_HASH };
    if (totalTokens <= 0) return { ok: false, value: ERR_INVALID_TOTAL_TOKENS };
    if (value <= 0) return { ok: false, value: ERR_INVALID_VALUE };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (!["beach", "mountain", "urban"].includes(propertyType)) return { ok: false, value: ERR_INVALID_PROPERTY_TYPE };
    if (capacity <= 0 || capacity > 20) return { ok: false, value: ERR_INVALID_CAPACITY };
    if (amenities.length > 200) return { ok: false, value: ERR_INVALID_AMENITIES };
    if (this.state.propertiesByLocation.has(location)) return { ok: false, value: ERR_PROPERTY_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.registrationFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.nextPropertyId;
    const property: Property = {
      owner: this.caller,
      location,
      description,
      legalHash,
      totalTokens,
      timestamp: this.blockHeight,
      value,
      currency,
      status: true,
      propertyType,
      capacity,
      amenities,
    };
    this.state.properties.set(id, property);
    this.state.propertiesByLocation.set(location, id);
    this.state.nextPropertyId++;
    return { ok: true, value: id };
  }

  getProperty(id: number): Property | null {
    return this.state.properties.get(id) || null;
  }

  updateProperty(id: number, updateLocation: string, updateDescription: string): Result<boolean> {
    const property = this.state.properties.get(id);
    if (!property) return { ok: false, value: false };
    if (property.owner !== this.caller) return { ok: false, value: false };
    if (!updateLocation || updateLocation.length > 100) return { ok: false, value: false };
    if (!updateDescription || updateDescription.length > 500) return { ok: false, value: false };
    if (this.state.propertiesByLocation.has(updateLocation) && this.state.propertiesByLocation.get(updateLocation) !== id) {
      return { ok: false, value: false };
    }

    const updated: Property = {
      ...property,
      location: updateLocation,
      description: updateDescription,
      timestamp: this.blockHeight,
    };
    this.state.properties.set(id, updated);
    this.state.propertiesByLocation.delete(property.location);
    this.state.propertiesByLocation.set(updateLocation, id);
    this.state.propertyUpdates.set(id, {
      updateLocation,
      updateDescription,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  getPropertyCount(): Result<number> {
    return { ok: true, value: this.state.nextPropertyId };
  }

  verifyProperty(id: number): Result<boolean> {
    return { ok: true, value: this.state.properties.has(id) };
  }
}

describe("PropertyRegistry", () => {
  let contract: PropertyRegistryMock;

  beforeEach(() => {
    contract = new PropertyRegistryMock();
    contract.reset();
  });

  it("registers a property successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    const result = contract.registerProperty(
      "Beach House",
      "Luxury beachfront property",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool, WiFi"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const property = contract.getProperty(0);
    expect(property?.location).toBe("Beach House");
    expect(property?.description).toBe("Luxury beachfront property");
    expect(property?.totalTokens).toBe(1000);
    expect(property?.value).toBe(500000);
    expect(property?.currency).toBe("USD");
    expect(property?.propertyType).toBe("beach");
    expect(property?.capacity).toBe(8);
    expect(property?.amenities).toBe("Pool, WiFi");
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate property locations", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Beach House",
      "Luxury beachfront property",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool, WiFi"
    );
    const result = contract.registerProperty(
      "Beach House",
      "Another description",
      legalHash,
      2000,
      1000000,
      "STX",
      "mountain",
      10,
      "Spa, Gym"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PROPERTY_ALREADY_EXISTS);
  });

  it("rejects registration without authority contract", () => {
    const legalHash = new Uint8Array(32).fill(0);
    const result = contract.registerProperty(
      "NoAuth",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid total tokens", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    const result = contract.registerProperty(
      "InvalidTokens",
      "Description",
      legalHash,
      0,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_TOTAL_TOKENS);
  });

  it("rejects invalid legal hash", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(31).fill(0);
    const result = contract.registerProperty(
      "InvalidHash",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_LEGAL_HASH);
  });

  it("updates a property successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Old Location",
      "Old Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    const result = contract.updateProperty(0, "New Location", "New Description");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const property = contract.getProperty(0);
    expect(property?.location).toBe("New Location");
    expect(property?.description).toBe("New Description");
    const update = contract.state.propertyUpdates.get(0);
    expect(update?.updateLocation).toBe("New Location");
    expect(update?.updateDescription).toBe("New Description");
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update for non-existent property", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.updateProperty(99, "New Location", "New Description");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects update by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Test Property",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateProperty(0, "New Location", "New Description");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets registration fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setRegistrationFee(2000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.registrationFee).toBe(2000);
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Test Property",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    expect(contract.stxTransfers).toEqual([{ amount: 2000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects registration fee change without authority contract", () => {
    const result = contract.setRegistrationFee(2000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("returns correct property count", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Property1",
      "Desc1",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    contract.registerProperty(
      "Property2",
      "Desc2",
      legalHash,
      2000,
      1000000,
      "STX",
      "mountain",
      10,
      "Spa"
    );
    const result = contract.getPropertyCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("verifies property existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Test Property",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    const result = contract.verifyProperty(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const result2 = contract.verifyProperty(99);
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("rejects property registration with empty location", () => {
    contract.setAuthorityContract("ST2TEST");
    const legalHash = new Uint8Array(32).fill(0);
    const result = contract.registerProperty(
      "",
      "Description",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_LOCATION);
  });

  it("rejects property registration with max properties exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxProperties = 1;
    const legalHash = new Uint8Array(32).fill(0);
    contract.registerProperty(
      "Property1",
      "Desc1",
      legalHash,
      1000,
      500000,
      "USD",
      "beach",
      8,
      "Pool"
    );
    const result = contract.registerProperty(
      "Property2",
      "Desc2",
      legalHash,
      2000,
      1000000,
      "STX",
      "mountain",
      10,
      "Spa"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_PROPERTIES_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });
});