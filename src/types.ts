import type { Shot } from "@nxg-org/mineflayer-custom-pvp";
import type { Entity } from "prismarine-entity";
import type { NormalizedEnchant } from "prismarine-item";

export enum WeaponType {
    "melee" = 0,
    "ranged" = 1,
    "other" = 2,
}

export type BaseEvent = {
    entity: Entity;
    tickTime: number;
    used: boolean;
};
export type BaseEvents = {
    [entityId: number]: BaseEvent[];
};
export type BaseWeaponInfo = {
    name: string;
    enchants: NormalizedEnchant[] | null;
};

export interface RangedWeaponInfo extends BaseWeaponInfo {
    shot: Shot;
}
export interface MeleeWeaponInfo extends BaseWeaponInfo {
    range: number;
}

export interface DamagedEntity extends BaseEvent {
    damageCaused: number;
}
export type DamagedEntities = {
    [entityId: number]: DamagedEntity[];
};

export interface AttackingEntity extends BaseEvent {
    weaponType: WeaponType;
    weaponInfo: MeleeWeaponInfo | RangedWeaponInfo;
    yaw: number;
    pitch: number;
}
export type AttackingEntities = {
    [entityId: number]: AttackingEntity[];
};

export type CorrelatedEvent = {
    hurt: DamagedEntity
    attacker: AttackingEntity
};

export type CorrelatedEvents = {
    [timeOfDamage: number]: CorrelatedEvent[];
};
