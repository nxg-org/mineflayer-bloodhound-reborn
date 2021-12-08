import type { Bot } from "mineflayer";
import type { Entity } from "prismarine-entity";
import { Vec3 } from "vec3";
import { entityToEntityYaw, getTickTimeDelta, secondsToTicks } from "./mathUtil";
import {
    WeaponType,
    DamagedEntity,
    AttackingEntity,
    CorrelatedEvents,
    DamagedEntities,
    AttackingEntities,
    BaseEvent,
    BaseEvents,
    MeleeWeaponInfo,
    RangedWeaponInfo,
    CorrelatedEvent,
} from "./types";
import { Shot } from "@nxg-org/mineflayer-custom-pvp";

const emptyVec = new Vec3(0, 0, 0);
export class BloodHound {
    private lastEntitiesDamaged: DamagedEntities = {};
    private lastAttackingEntities: AttackingEntities = {};
    public correlatedEvents: CorrelatedEvents = {};
    public maxAttackYawDelta: number = 1; //degrees
    public maxEntryAge: number = 100; //ticks
    public maxCachedEventsAge: number = 100; //ticks
    public maxCachedEventsLength: number = 5;
    public maxAttackEntryLength: number = 5;
    public maxDamagedEntryLength: number = 5;
    public maxMeleeDelta = 5; //ticks
    public maxMeleeDistance = 5;
    public maxRangedDelta = 200; //ticks
    public maxRangedDistance = 128;

    constructor(private bot: Bot) {
        bot._client.prependListener("entity_metadata", (packet) => {
            const entityId = packet.entityId;
            const entity = this.bot.entities[entityId];
            if ((packet.metadata as any[]).find(md => md.key === 7) === -1) return;


            const healthChange = this.bot.util.entity.getHealthChange(packet.metadata, entity);
            if (healthChange < 0) {
                // console.log(`Entity damaged: ${entity.username ?? entity.name}`)
                const info = this.buildEntityDamagedObject(entity, healthChange);
                this.lastEntitiesDamaged[entityId] ??= [];
                this.lastEntitiesDamaged[entityId].push(info);
                this.bot.emit("bloodhoundEntityDamaged", entity, info);
            }
        });

        this.bot.on("entitySpawn", async (entity) => {
            if (entity.name === "arrow") {
                // if (entity.onGround) return;
                const possibleEntitesSorted = Object.values(bot.entities)
                    .filter((e) => ["player", "skeleton", "piglin"].includes(e.name ?? ""))
                    .filter(e => e.position.distanceTo(entity.position) < 4)
                    .sort((a, b) => entity.position.distanceTo(a.position) - entity.position.distanceTo(b.position));
                if (possibleEntitesSorted.length === 0) return;
                const responsibleEntity = possibleEntitesSorted[0];
                // console.log(`Entity attacked: ${responsibleEntity.username ?? responsibleEntity.name}`)
                for (let i = 0; i < 3; i++) {
                    await this.bot.waitForTicks(1);
                    if (!entity.velocity.equals(emptyVec) || !entity.onGround) break;
                }
                const info = this.buildAttackingEntityObject(responsibleEntity, 1, undefined, entity);
                this.lastAttackingEntities[responsibleEntity.id] ??= [];
                this.lastAttackingEntities[responsibleEntity.id].push(info);
                this.bot.emit("bloodhoundEntityAttacks", entity, info);
            }
        });

        //TODO: Make better in-view detection (In util plugin).
        // Fuck, this is really simple if I have that detection.
        this.bot.on("entitySwingArm", (entity) => {

            //TODO: Detect if mining/other cause of swinging arm, ignore otherwise.
            // if (["sword", "_axe"].some((n) => entity.heldItem?.name.includes(n))) {
                const targetEntity = this.bot.util.raytrace.entityAtEntityCursor(entity, 3.5)
                if (!targetEntity) return;
                // console.log(`Entity attacked: ${entity.username ?? entity.name}`)
                this.lastAttackingEntities[entity.id] ??= [];
                this.lastAttackingEntities[entity.id].push(this.buildAttackingEntityObject(entity, 0));
            // }
        });

        this.bot.on("bloodhoundEntityDamaged", (entity, info) => {
            this.findAttacker(entity, info.tickTime);
        });
    }

    objectsToList(obj: BaseEvents): BaseEvent[] {
        return Object.values(obj).flatMap((entry) => entry.sort((a, b) => b.tickTime - a.tickTime));
    }

    isAttackYawValid(yaw: number, attacker: Entity, victim: Entity) {
        return Math.abs(yaw - entityToEntityYaw(attacker.position, victim.position)) < this.maxAttackYawDelta;
    }

    buildEntityDamagedObject(entity: Entity, damageCaused: number): DamagedEntity {
        return { entity, damageCaused, tickTime: secondsToTicks(performance.now()), used: false };
    }

    buildAttackingEntityObject(
        entity: Entity,
        weaponType: WeaponType,
        weaponName?: string,
        projectile?: { position: Vec3; velocity: Vec3 }
    ): AttackingEntity {
        weaponName ??= (entity.heldItem?.name ?? "empty")!;
        let weaponInfo: MeleeWeaponInfo | RangedWeaponInfo;
        switch (weaponType) {
            case 0:
            default:
                weaponInfo = { name: weaponName, enchants: entity.heldItem?.enchants, range: 5 };
                break;
            case 1:
                weaponInfo = { name: weaponName, enchants: entity.heldItem?.enchants, shot: Shot.fromArrow(this.bot.world, projectile!) };
                break;
        }

        const yaw = entity.yaw;
        const pitch = entity.pitch;
        return { entity, yaw, pitch, weaponType, weaponInfo, tickTime: secondsToTicks(performance.now()), used: false };
    }

    buildCorrelatedEvent(hurt: DamagedEntity, attacker: AttackingEntity): CorrelatedEvent {
        return { hurt, attacker };
    }

    cleanupAttackers() {
        const min_time = secondsToTicks(performance.now() - this.maxEntryAge * 50);
        Object.entries(this.lastAttackingEntities).forEach((entry) => {
            const index = Number(entry[0]);
            this.lastAttackingEntities[index] = this.lastAttackingEntities[index].filter((e) => e.tickTime >= min_time);
            if (this.lastAttackingEntities[index].length === 0) delete this.lastAttackingEntities[index];
        });
    }

    cleanupDamaged() {
        const min_time = secondsToTicks(performance.now() - this.maxEntryAge * 50);
        Object.entries(this.lastEntitiesDamaged).forEach((entry) => {
            const index = Number(entry[0]);
            this.lastEntitiesDamaged[index] = this.lastEntitiesDamaged[index].filter((e) => e.tickTime >= min_time);
            if (this.lastEntitiesDamaged[index].length === 0) delete this.lastEntitiesDamaged[index];
        });
    }

    cleanupCachedEvents() {
        const min_time = secondsToTicks(performance.now() - this.maxEntryAge * 50);
        Object.keys(this.correlatedEvents)
            .map(Number)
            .forEach((key) => {
                if (key < min_time) delete this.correlatedEvents[key];
            });
    }

    // cleanupUsedEvents() {
    //     this.lastAttackingEntities = this.lastAttackingEntities.filter((entry) => !entry.used);
    //     this.lastEntitiesDamaged = this.lastEntitiesDamaged.filter((entry) => !entry.used);
    // }

    checkForCorrelation(hurt: DamagedEntity, attacker: AttackingEntity) {
        //TODO: Better filtering for flame.
        if (hurt.damageCaused === -1) return false;
        switch (attacker.weaponType) {
            case 0:
                if (getTickTimeDelta(hurt.tickTime, attacker.tickTime) > this.maxMeleeDelta) return false;
                if (!this.isAttackYawValid(attacker.yaw, attacker.entity, hurt.entity)) return false;
                if (this.bot.util.entity.getDistanceBetweenEntities(hurt.entity, attacker.entity) > this.maxMeleeDistance) return false;
                return true;
            case 1:
                // console.log(secondsToTicks(performance.now()), hurt.tickTime, attacker.tickTime)
                if (getTickTimeDelta(hurt.tickTime, attacker.tickTime) > this.maxRangedDelta) return false;
                //TODO: Fix shot to actually work.
                if (!(attacker.weaponInfo as RangedWeaponInfo).shot) return false;
                return true;
            default:
                console.log("other weapon type:", attacker.weaponType);
                return false;
        }
    }

    findAttacker(hurtEntity: Entity, time: number) {
        const attackingLen = Object.values(this.lastAttackingEntities).flat().length;
        const damagedLen = Object.values(this.lastEntitiesDamaged).flat().length;
        const correlatedEventsLen = Object.values(this.correlatedEvents).flat().length;
        // console.log(damagedLen, attackingLen, correlatedEventsLen);
        if (this.maxAttackEntryLength < attackingLen) this.cleanupAttackers();
        if (this.maxDamagedEntryLength < damagedLen) this.cleanupDamaged();
        if (this.maxCachedEventsLength < correlatedEventsLen) this.cleanupCachedEvents();
        if (attackingLen === 0 || damagedLen === 0) return null;
        const possibleEvent = this.correlatedEvents[time]?.find((val) => val.hurt.entity === hurtEntity);
        if (!!possibleEvent) return possibleEvent;

        const hurtEvent = this.lastEntitiesDamaged[hurtEntity.id]?.find((val) => val.tickTime === time);
        if (!hurtEvent) return null;

        const foundAttacker = this.objectsToList(this.lastAttackingEntities).find((attackingEntity) =>
            this.checkForCorrelation(hurtEvent, attackingEntity as AttackingEntity)
        ) as AttackingEntity | undefined;

        // console.log(foundAttacker)
        if (foundAttacker) {
            const event = this.buildCorrelatedEvent(hurtEvent, foundAttacker);
            this.correlatedEvents[time] ??= [];
            this.correlatedEvents[time].push(event);
            this.bot.emit("bloodhoundEvent", time, event);
        }
    }
}
