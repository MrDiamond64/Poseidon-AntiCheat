import * as Minecraft from "mojang-minecraft";
import { flag, banMessage, getClosestPlayer } from "./util.js";
import { commandHandler } from "./commands/handler.js";
import config from "./data/config.js";
import { banList } from "./data/globalban.js";
import data from "./data/data.js";
import { mainGui, playerSettingsMenuSelected } from "./features/ui.js";

const World = Minecraft.world;

if(config.debug === true) console.warn(`${new Date()} | Im not a dumbass and this actually worked :sunglasses:`);

World.events.beforeChat.subscribe(msg => {
    const message = msg.message.toLowerCase();
    const player = msg.sender;

    if(config.debug === true && message === "ping") console.warn(`${new Date()} | Pong!`);

    if(message.includes("the best minecraft bedrock utility mod")) msg.cancel = true;

    if(player.hasTag("isMuted")) {
        msg.cancel = true;
        player.tell("§r§6[§aScythe§6]§r §a§lNOPE! §r§aYou have been muted.");
    }

    // BadPackets/2 = chat message length check
    if(config.modules.badpackets2.enabled === true && message.length > config.modules.badpackets2.maxlength || message.length < config.modules.badpackets2.minLength) flag(player, "BadPackets", "2", "Exploit", "messageLength", `${message.length}`, false, msg);

    // Spammer/A = checks if someone sends a message while moving and on ground
    if(config.modules.spammerA.enabled === true && player.hasTag('moving') && player.hasTag('ground') && !player.hasTag('jump'))
        flag(player, "Spammer", "A", "Movement", false, false, true, msg);

    // Spammer/B = checks if someone sends a message while swinging their hand
    if(config.modules.spammerB.enabled === true && player.hasTag('left') && !player.getEffect(Minecraft.MinecraftEffectTypes.miningFatigue))
        flag(player, "Spammer", "B", "Combat", false, false, false, msg);

    // Spammer/C = checks if someone sends a message while using an item
    if(config.modules.spammerC.enabled === true && player.hasTag('right'))
        flag(player, "Spammer", "C", "Misc", false, false, false, msg);

    // Spammer/D = checks if someone sends a message while having a GUI open
    if(config.modules.spammerD.enabled === true && player.hasTag('hasGUIopen'))
        flag(player, "Spammer", "D", "Misc", false, false, false, msg);

    commandHandler(player, msg);

    // add's user custom tags to their messages if it exists or we fall back
    // also filter for non ASCII characters and remove them in messages
    if(player.name !== player.nameTag && !msg.cancel && !config.modules.filterUnicodeChat) {
        World.say(`<${player.nameTag}> ${msg.message.replace(/"/g, "").replace(/\\/g, "")}`);
        msg.cancel = true;
    } else if(player.name === player.nameTag && config.modules.filterUnicodeChat && !msg.cancel) {
        World.say(`<${player.nameTag}> ${msg.message.replace(/[^\x00-\xFF]/g, "").replace(/"/g, "").replace(/\\/g, "")}`);
        msg.cancel = true;
    }
});

World.events.tick.subscribe(({ currentTick }) => {
    if(config.modules.itemSpawnRateLimit.enabled) data.entitiesSpawnedInLastTick = 0;

    // run as each player
    for (let player of World.getPlayers()) {
        if(player.isGlobalBanned === true) {
            try {
                player.addTag("by:Scythe Anticheat");
                player.addTag("reason:You are Scythe Anticheat global banned!");
                player.addTag("isBanned");
            } catch {}
        }

        // sexy looking ban message
        if(player.hasTag("isBanned")) banMessage(player);

        player.blocksBroken = 0;
        player.entitiesHit = [];
        if(Date.now() - player.startBreakTime < config.modules.autotoolA.startBreakDelay) {
            // console.warn(1, player.lastSelectedSlot, player.selectedSlot);
            if(player.lastSelectedSlot !== player.selectedSlot) player.flagAutotoolA = true;
        }

        // BadPackets[5] = checks for horion freecam
        if(typeof player.badpackets5Ticks !== "number") player.badpackets5Ticks = 0;
        if(config.modules.badpackets5.enabled && player.velocity.y.toFixed(6) === "0.420000" && !player.hasTag("dead")) {
            player.badpackets5Ticks++;
            if(player.badpackets5Ticks > 2) flag(player, "BadPackets", "5", "Exploit", "yVelocity", player.velocity.y.toFixed(6), true);
        } else if(player.badpackets5Ticks !== 0) player.badpackets5Ticks--;

        // Crasher/A = invalid pos check
        if(config.modules.crasherA.enabled && Math.abs(player.location.x) > 30000000 ||
            Math.abs(player.location.y) > 30000000 || Math.abs(player.location.z) > 30000000) 
                flag(player, "Crasher", "A", "Exploit", "x_pos", `${player.location.x},y_pos=${player.location.y},z_pos=${player.location.z}`, true);

        // anti-namespoof
        // these values are set in the playerJoin config
        if(player.flagNamespoofA === true) {
            flag(player, "Namespoof", "A", "Exploit", "nameLength", player.name.length);
            player.flagNamespoofA = false;
        }
        if(player.flagNamespoofB === true) {
            flag(player, "Namespoof", "B", "Exploit");
            player.flagNamespoofB = false;
        }
        if(player.flagNamespoofC === true) {
            flag(player, "Namespoof", "C", "Exploit", "oldName", player.oldName);
            player.flagNamespoofC = false;
        }

        // player position shit
        if(player.hasTag("moving")) {
            player.runCommandAsync(`scoreboard players set @s xPos ${Math.floor(player.location.x)}`);
            player.runCommandAsync(`scoreboard players set @s yPos ${Math.floor(player.location.y)}`);
            player.runCommandAsync(`scoreboard players set @s zPos ${Math.floor(player.location.z)}`);
        }

        if(config.modules.bedrockValidate.enabled === true) {
            if(typeof player.scoreboard !== "undefined" && World.scoreboard.getObjective("bedrock")?.getScore(player.scoreboard) >= 1) {
                if(config.modules.bedrockValidate.overworld && player.dimension.id === "minecraft:overworld") {
                    player.runCommandAsync("fill ~-5 -64 ~-5 ~5 -64 ~5 bedrock");
                    player.runCommandAsync("fill ~-4 -59 ~-4 ~4 319 ~4 air 0 replace bedrock");
                }

                if(config.modules.bedrockValidate.nether && player.dimension.id === "minecraft:nether") { 
                    player.runCommandAsync("fill ~-5 0 ~-5 ~5 0 ~5 bedrock");
                    player.runCommandAsync("fill ~-5 127 ~-5 ~5 127 ~5 bedrock");
                    player.runCommandAsync("fill ~-5 5 ~-5 ~5 120 ~5 air 0 replace bedrock");
                }
            }
        }

        let playerSpeed = Math.sqrt(Math.abs(player.velocity.x**2 + player.velocity.z**2));

        // if(config.debug === true) console.warn(`${new Date()} | ${player.name}'s speed: ${playerSpeed.toFixed(4)} Vertical Speed: ${player.velocity.y}`);

        // NoSlow/A = speed limit check
        if(config.modules.noslowA.enabled && playerSpeed.toFixed(2) >= config.modules.noslowA.speed && playerSpeed.toFixed(2) <= config.modules.noslowA.maxSpeed) {
            if(!player.getEffect(Minecraft.MinecraftEffectTypes.speed) && player.hasTag('moving') && player.hasTag('right') && player.hasTag('ground') && !player.hasTag('jump') && !player.hasTag('gliding') && !player.hasTag('swimming') && !player.hasTag("trident") && typeof player.scoreboard !== "undefined" && World.scoreboard.getObjective("right")?.getScore(player.scoreboard) >= 5) {
                flag(player, "NoSlow", "A", "Movement", "speed", playerSpeed.toFixed(3), true);
            }
        }

        let container = player.getComponent('inventory').container;
        for (let i = 0; i < container.size; i++) {
            let item = container.getItem(i);
            if(typeof item === "undefined") continue;

            // Illegalitems/C = item stacked over 64 check
            if(config.modules.illegalitemsC.enabled && item.amount > config.modules.illegalitemsC.maxStack)
                flag(player, "IllegalItems", "C", "Exploit", "stack", item.amount, false, false, i);
                
            // Illegalitems/D = additional item clearing check
            if(config.modules.illegalitemsD.enabled && config.itemLists.items_very_illegal.includes(item.id))
                flag(player, "IllegalItems", "D", "Exploit", "item", item.id, false, false, i);

            // CommandBlockExploit/H = clear items
            if(config.modules.commandblockexploitH.enabled && config.itemLists.cbe_items.includes(item.id))
                flag(player, "CommandBlockExploit", "H", "Exploit", "item", item.id, false, false, i);
                
            // Illegalitems/F = Checks if an item has a name longer then 32 characters
            if(config.modules.illegalitemsF.enabled && item.nameTag?.length > config.modules.illegalitemsF.length)
                flag(player, "IllegalItems", "F", "Exploit", "name", `${item.nameTag},length=${item.nameTag.length}`, false, false, i);

            // BadEnchants/D = checks if an item has a lore
            if(config.modules.badenchantsD.enabled && item.getLore().length) {
                if(!config.modules.badenchantsD.exclusions.includes(String(item.getLore())))
                    flag(player, "BadEnchants", "D", "Exploit", "lore", String(item.getLore()), false, false, i);
            }

            if((config.modules.badenchantsA.enabled || config.modules.badenchantsB.enabled || config.modules.badenchantsC.enabled) && currentTick % 2) {
                let itemEnchants = item.getComponent("enchantments").enchantments;

                let protection_types = [];

                for (let enchantment in Minecraft.MinecraftEnchantmentTypes) {
                    let enchantData = itemEnchants.getEnchantment(Minecraft.MinecraftEnchantmentTypes[enchantment]);
        
                    if(typeof enchantData === "object") {
                        if(config.modules.badenchantsE.enabled && enchantData.type.id.toLowerCase().endsWith("protection"))
                            protection_types.push(enchantData.type.id);

                        // badenchants/A = checks for items with invalid enchantment levels
                        let maxLevel = config.modules.badenchantsA.levelExclusions[enchantData.type.id];
                        if(config.modules.badenchantsA.enabled && maxLevel) {
                            if(enchantData.level > maxLevel) flag(player, "BadEnchants", "A", "Exploit", "enchant", `minecraft:${enchantData.type.id},level=${enchantData.level}`, false, false, i);
                        } else if(config.modules.badenchantsA.enabled && enchantData.level > Minecraft.MinecraftEnchantmentTypes[enchantment].maxLevel)
                                flag(player, "BadEnchants", "A", "Exploit", "enchant", `minecraft:${enchantData.type.id},level=${enchantData.level}`, false, false, i);

                        // badenchants/B = checks for negative enchantment levels
                        if(config.modules.badenchantsB.enabled && enchantData.level <= 0) 
                            flag(player, "BadEnchants", "B", "Exploit", "enchant", `minecraft:${enchantData.type.id},level=${enchantData.level}`, false, false, i);

                        // badenchants/C = checks if an item has an enchantment which isnt support by the item
                        if(config.modules.badenchantsC.enabled) {
                            let item2 = new Minecraft.ItemStack(Minecraft.ItemTypes.get(item.id), 1, item.data);
                            if(!item2.getComponent("enchantments").enchantments.canAddEnchantment(new Minecraft.Enchantment(Minecraft.MinecraftEnchantmentTypes[enchantment], 1))) {
                                flag(player, "BadEnchants", "C", "Exploit", "item", `${item.id},enchant=minecraft:${enchantData.type.id},level=${enchantData.level}`, false, false, i);
                            }
                        }
                    }
                }
                // BadEnchants/E = checks for multi-protection armor
                if(config.modules.badenchantsE.enabled && protection_types.length > config.modules.badenchantsE.maximuim_protection_types) 
                    flag(player, "BadEnchants", "E", "Exploit", "protection_types", String(protection_types), false, false, i);
            }
        }

        // invalidsprint/a = checks for sprinting with the blindness effect
        if(config.modules.invalidsprintA.enabled && player.getEffect(Minecraft.MinecraftEffectTypes.blindness) && player.hasTag('sprint'))
            flag(player, "InvalidSprint", "A", "Movement", false, false, true);

        // fly/a
        if(config.modules.flyA.enabled && Math.abs(player.velocity.y).toFixed(4) === "0.1552" && !player.hasTag("jump") && !player.hasTag("gliding") && !player.hasTag("riding") && !player.hasTag("levitating") && player.hasTag("moving")) {
            let pos1 = new Minecraft.BlockLocation(player.location.x + 2, player.location.y + 1, player.location.z + 2);
            let pos2 = new Minecraft.BlockLocation(player.location.x - 2, player.location.y - 1, player.location.z - 2);

            let blocksBetween = pos1.blocksBetween(pos2);

            let isNotInAir = blocksBetween.some((block) => player.dimension.getBlock(block).id !== "minecraft:air");

            if(isNotInAir === false) flag(player, "Fly", "A", "Movement", "vertical_speed", Math.abs(player.velocity.y).toFixed(4), true);
                else if(config.debug === true) console.warn(`${new Date()} | ${player.name} was detected with flyA motion but was found near solid blocks.`);
        }

        if(config.modules.autoclickerA.enabled && player.cps > 0 && Date.now() - player.firstAttack >= config.modules.autoclickerA.checkCPSAfter) {
            player.cps = player.cps / ((Date.now() - player.firstAttack) / 1000);
            // autoclicker/A = checks for high cps
            if(player.cps > config.modules.autoclickerA.maxCPS) flag(player, "Autoclicker", "A", "Combat", "CPS", player.cps);

            // player.runCommand(`say ${player.cps}, ${player.lastCPS}. ${player.cps - player.lastCPS}`);

            // autoclicker/B = checks if cps is similar to last cps (WIP)
            /*
            let cpsDiff = Math.abs(player.cps - player.lastCPS);
            if(player.cps > 3 && cpsDiff > 0.81 && cpsDiff < 0.96) flag(player, "AutoClicker", "B", "Combat", "CPS", `${player.cps},last_cps=${player.lastCPS}`);
            player.lastCPS = player.cps;
            */

            player.firstAttack = Date.now();
            player.cps = 0;
        }

		// BadPackets[4] = checks for invalid selected slot
        if(config.modules.badpackets4.enabled && player.selectedSlot < 0 || player.selectedSlot > 8) {
            flag(player, "BadPackets", "4", "Exploit", "selectedSlot", `${player.selectedSlot}`);
            player.selectedSlot = 0;
        }

        // if(config.debug === true) console.warn(`${new Date()} | reached end of tick event. current tick: ${currentTick}`);
    }
});

World.events.blockPlace.subscribe((blockPlace) => {
    let block = blockPlace.block;
    let player = blockPlace.player;

    if(config.debug === true) console.warn(`${player.nameTag} has placed ${block.id}.`);

    // IllegalItems/H = checks for pistons that can break any block
    if(config.modules.illegalitemsH.enabled === true && block.id === "minecraft:piston" || block.id === "minecraft:sticky_piston") {
        let piston = block.getComponent("piston");
    
        if(!piston.isRetracted || piston.isRetracting || piston.isMoving || piston.isExpanding || piston.isExpanded) {
            flag(player, "IllegalItems", "H", "Exploit", "isRetracted", `${piston.isRetracted},isRetracting=${piston.isRetracting},isMoving=${piston.isMoving},isExpanding=${piston.isExpanding},isExpanded=${piston.isExpanded}`, false, false, player.selectedSlot);
            block.setType(Minecraft.MinecraftBlockTypes.air);
        }
    }
});

World.events.blockBreak.subscribe((blockBreak) => {
    let player = blockBreak.player;
    let dimension = blockBreak.dimension;
    let block = blockBreak.block;

    if(config.debug === true) console.warn(`${player.nameTag} has broken the block ${blockBreak.brokenBlockPermutation.type.id}`);

    // nuker/a = checks if a player breaks more than 3 blocks in a tick
    if(config.modules.nukerA.enabled) {
        player.blocksBroken++;

        if(player.blocksBroken > config.modules.nukerA.maxBlocks) {
            flag(player, "Nuker", "A", "Misc", "blocksBroken", player.blocksBroken);

            // killing all the items it drops
            let droppedItems = dimension.getEntities({
                location: block.location,
                minDistance: 0,
                maxDistance: 2,
                type: "item"
            });

            for (let item of droppedItems) item.kill();

            block.setPermutation(blockBreak.brokenBlockPermutation);
        }
    }

    // liquidinteract/a = checks if a player breaks a liquid source block
    if(config.modules.liquidinteractA.enabled) {
        if(config.modules.liquidinteractA.liquids.includes(blockBreak.brokenBlockPermutation.type.id)) {
            flag(player, "LiquidInteract", "A", "Misc", "block", blockBreak.brokenBlockPermutation.type.id);
            block.setPermutation(blockBreak.brokenBlockPermutation);
        }
    }

    // Autotool/A = checks for player slot mismatch
    // This was a nightmare to debug...
    if(config.modules.autotoolA.enabled) {
        // console.warn("block break ", Date.now() - player.startBreakTime);
        if(player.flagAutotoolA === true) {
            flag(player, "AutoTool", "A", "Misc", "selectedSlot", `${player.selectedSlot},lastSelectedSlot=${player.lastSelectedSlot}`);
        }
    }
});

World.events.beforeItemUseOn.subscribe((beforeItemUseOn) => {
    let player = beforeItemUseOn.source;
    let item = beforeItemUseOn.item;

    // commandblockexploit/f = cancels the placement of cbe items
    if(config.modules.commandblockexploitF.enabled && config.itemLists.cbe_items.includes(item.id)) {
        flag(player, "CommandBlockExploit","F", "Exploit", "block", item.id, false, false, player.selectedSlot);
        beforeItemUseOn.cancel = true;
    }

    /*
        illegalitems/e = cancels the placement of illegal items
        illegalitems/a could be bypassed by using a right click autoclicker/autobuild or lag
        thx drib or matrix_code for telling me lol
    */
    if(config.modules.illegalitemsE.enabled) {
        // items that are obtainble using commands
        if(player.hasTag("op") === false) {
            if(config.itemLists.items_semi_illegal.includes(item.id)) {
                // dont affect gmc players
                try {
                    player.runCommand("testfor @s[m=!c]");
                    flag(player, "IllegalItems", "E", "Exploit", "block", item.id, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                } catch {}
            }

            // patch element blocks
            if(config.itemLists.elements && item.id.startsWith("minecraft:element_")) {
                // dont affect gmc players
                try {
                    player.runCommand("testfor @s[m=!c]");
                    flag(player.source, "IllegalItems", "E", "Exploit", "block", item.id, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                } catch {}
            }
            
            // patch spawn eggs
            if(config.itemLists.spawnEggs && item.id.endsWith("_spawn_egg")) {
                // dont affect gmc players
                try {
                    player.runCommand("testfor @s[m=!c]");
                    flag(player, "IllegalItems", "E", "Exploit", "block", item.id, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                } catch {}
            }
        }
    
        // items that cannot be obtained normally
        if(config.itemLists.items_very_illegal.includes(item.id)) {
            flag(player, "IllegalItems", "E", "Exploit", "item", item.id, false, false, player.selectedSlot);
            beforeItemUseOn.cancel = true;
        }
    }
});

World.events.playerJoin.subscribe((playerJoin) => {
    let player = playerJoin.player;

    // fix a disabler method
    player.nameTag = player.nameTag.replace(/[^A-Za-z0-9_\-() ]/gm, "");

    if(!data.loaded) {
        try {
            player.runCommand("scoreboard players set scythe:config gametestapi 1");
            data.loaded = true;
        } catch {}
    }

    // remove tags
    player.removeTag("attack");
    player.removeTag("hasGUIopen");
    player.removeTag("right");
    player.removeTag("left");
    player.removeTag("ground");
    player.removeTag("gliding");

    // load custom nametag
    let foundName;

    player.getTags().forEach(t => {
        // Namespoof/C
        // adding a double qoute makes it so commands cant remove the tag, and cant add the tag to other people
        if(config.modules.namespoofC.enabled && t.startsWith("\"name:\n")) foundName = t.replace("\"name:\n", "");

        // load custom nametag
        t = t.replace(/"|\\/g, "");
        if(t.startsWith("tag:"))
            player.nameTag = `§8[§r${t.slice(4)}§8]§r ${player.name}`;
    });

    if(config.modules.namespoofC.enabled) {
        if(!foundName) {
            player.addTag(`"name:\n${player.name}`);
        } else if(foundName !== player.name) {
            player.flagNamespoofC = true;
            player.oldName = foundName;
        }
    }

    // Namespoof/A = username length check.
    if(config.modules.namespoofA.enabled) {
        // checks if 2 players are logged in with the same name
        // minecraft adds a sufix to the end of the name which we detect
        if(player.name?.endsWith(')') && (player.name?.length > config.modules.namespoofA.maxNameLength + 3 || player.name?.length < config.modules.namespoofA.minNameLength))
            player.flagNamespoofA = true;

        if(!player.name?.endsWith(')') && (player.name?.length < config.modules.namespoofA.minNameLength || player.name?.length > config.modules.namespoofA.maxNameLength))
            player.flagNamespoofA = true;

        if(player.flagNamespoofA) {
            let extraLength = player.name.length - config.modules.namespoofA.maxNameLength;
            player.nameTag = player.name.slice(0, -extraLength) + "...";
        }
    }

    // Namespoof/B = regex check
    if(config.modules.namespoofB.enabled && config.modules.namespoofB.regex.test(player.name)) player.flagNamespoofB = true;

    // check if the player is in the global ban list
    if(banList.includes(player.name.toLowerCase()) || banList.includes(player.oldName.toLowerCase())) player.isGlobalBanned = true;
});

World.events.entityCreate.subscribe((entityCreate) => {
    let entity = entityCreate.entity;

    if(config.modules.itemSpawnRateLimit.enabled) {
        data.entitiesSpawnedInLastTick++;

        if(data.entitiesSpawnedInLastTick > config.modules.itemSpawnRateLimit.entitiesBeforeRateLimit) {
            if(config.debug === true) console.warn(`Killed "${entity.id}" due to item spawn ratelimit reached.`);
            entity.kill();
        }
    }
    if(config.modules.commandblockexploitG.enabled) {
        if(config.modules.commandblockexploitG.entities.includes(entity.id.toLowerCase())) {
            flag(getClosestPlayer(entity), "CommandBlockExploit", "G", "Exploit", "entity", entity.id);
            entity.kill();
        }

        if(config.modules.commandblockexploitG.npc && entity.id === "minecraft:npc") {
            try {
                entity.runCommand("scoreboard players operation @s npc = scythe:config npc");
                entity.runCommand("testfor @s[scores={npc=1..}]");
                flag(getClosestPlayer(entity), "CommandBlockExploit", "G", "Exploit", "entity", entity.id);
                entity.kill();
            } catch {}
        }
    }
    if(config.modules.crasherB.enabled && entity.id === "minecraft:item") {
        let itemData = entity.getComponent("item").itemStack;

        if(itemData.id === "minecraft:arrow" && itemData.data > 43) {
            flag(getClosestPlayer(entity), "Crasher", "B", "Exploit", "item", `${itemData.id},data=${itemData.data}`);
            entity.kill();
        }
    }
});

World.events.entityHit.subscribe((entityHit) => {
    let entity = entityHit.hitEntity;
    let block = entityHit.hitBlock;
    let player = entityHit.entity;

    if(player.id !== "minecraft:player") return;

    if(typeof entity === "object") {
        let entityHitName = entity.nameTag || entity.id;
        
        // killaura/C = checks for multi-aura
        if(config.modules.killauraC.enabled) {
            if(!player.entitiesHit.includes(entityHitName)) {
                player.entitiesHit.push(entityHitName);
                if(player.entitiesHit.length >= config.modules.killauraC.entities) {
                    flag(player, "KillAura", "C", "Combat", "entitiesHit", player.entitiesHit.length);
                }
            }
        }

        // reach/A = check if a player hits an entity more then 5.1 block away
        if(config.modules.reachA.enabled) {
            // get the difference between 2 three dimensional coordinates
            let distance = Math.sqrt(Math.pow(entity.location.x - player.location.x, 2) + Math.pow(entity.location.y - player.location.y, 2) + Math.pow(entity.location.z - player.location.z, 2));
            if(config.debug === true) console.warn(`${player.name} attacked ${entityHitName} with a distance of ${distance}`);

            if(distance > config.modules.reachA.reach && entity.id.startsWith("minecraft:") && !config.modules.reachA.entities_blacklist.includes(entity.id)) {
                // we ignore gmc players as they get increased reach
                try {
                    player.runCommand("testfor @s[m=!c]");
                    flag(player, "Reach", "A", "Combat", "entity", `${entity.id},distance=${distance}`);
                } catch {}
            }
        }

        // badpackets[3] = checks if a player attacks themselves
        // some (bad) hacks use this to bypass anti-movement cheat checks
        if(config.modules.badpackets3.enabled && entity === player) flag(player, "BadPackets", "3", "Exploit");
    
        // check if the player was hit with the UI item, and if so open the UI for that player
        let container = player.getComponent("inventory").container;

        let item = container.getItem(player.selectedSlot);
        if(config.customcommands.gui.enabled && entity.id === "minecraft:player" && item?.id === "minecraft:wooden_axe" && player.hasTag("op") && item?.nameTag === "§r§l§aRight click to Open the UI") {
            playerSettingsMenuSelected(player, entity);
        }

        // autoclicker/a = check for high cps
        if(config.modules.autoclickerA.enabled || !data.checkedModules.autoclicker) {
            // if anti-autoclicker is disabled in game then disable it in config.js
            if(data.checkedModules.autoclicker === false) {
                if(typeof player.scoreboard !== "undefined" && World.scoreboard.getObjective("autoclicker")?.getScore(player.scoreboard) >= 1) {
                    config.modules.autoclickerA.enabled = false;
                }
                data.checkedModules.autoclicker = true;
            }

            if(typeof player.firstAttack !== "number") player.firstAttack = Date.now();
            if(typeof player.cps !== "number") player.cps = 0;
            player.cps++;
        }
    }

    if(typeof block === "object") {
        if(config.modules.autotoolA.enabled) {
            // console.warn("hit block", Date.now() - player.startBreakTime);
            player.flagAutotoolA = false;
            player.lastSelectedSlot = player.selectedSlot;
            player.startBreakTime = Date.now();
        }
    }
});

World.events.beforeItemUse.subscribe((beforeItemUse) => {
    let item = beforeItemUse.item;
    let player = beforeItemUse.source;

    // GUI stuff
    if(config.customcommands.gui.enabled && item.id === "minecraft:wooden_axe" && item.nameTag === "§r§l§aRight click to Open the UI" && player.hasTag("op")) {
        mainGui(player);
        beforeItemUse.cancel = true;
    }

    // patch a bypass for the freeze system
    if(item.id === "minecraft:milk_bucket" && player.hasTag("freeze"))
        beforeItemUse.cancel = true;
});

Minecraft.system.events.beforeWatchdogTerminate.subscribe((beforeWatchdogTerminate) => {
    // We try to stop any watchdog crashes incase malicous users try to make the scripts lag
    // and causing the server to crash
    beforeWatchdogTerminate.cancel = true;

    console.warn(`${new Date()} | A Watchdog Exception has been detected and has been cancelled sucessfully. Reason: ${beforeWatchdogTerminate.terminateReason}`);
});
