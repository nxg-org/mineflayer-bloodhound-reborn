import { Bot } from "mineflayer";
import utilPlugin from "@nxg-org/mineflayer-util-plugin"
import customPVP from "@nxg-org/mineflayer-custom-pvp"
import { BloodHound } from "./bloodhound";
import type {Entity} from "prismarine-entity"
import type { Item } from "prismarine-item";
import { AttackingEntity, CorrelatedEvent, DamagedEntity } from "./types";

declare module "mineflayer" {
    interface Bot {
        bloodhound: BloodHound
    }
    interface BotEvents {
        bloodhoundEntityDamaged: (hurt: Entity, info: DamagedEntity) => void;
        bloodhoundEntityAttacks: (attacker: Entity, info: AttackingEntity) => void;
        bloodhoundEvent: (time: number, event: CorrelatedEvent) => void;
    }
}

export default function inject(bot: Bot) {
    if (!bot.hasPlugin(customPVP)) bot.loadPlugin(customPVP)
    bot.loadPlugin(utilPlugin)
    bot.bloodhound = new BloodHound(bot);
}

