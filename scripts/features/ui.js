// @ts-check
import * as Minecraft from "@minecraft/server";
import * as MinecraftUI from "@minecraft/server-ui";

import { parseTime, capitalizeFirstLetter, addOp, removeOp, tellAllStaff } from "../util.js";
import { wipeEnderchest } from "../commands/utility/ecwipe.js";

import config from "../data/config.js";
import data from "../data/data.js";

const world = Minecraft.world;

const playerIcons = [
    "textures/ui/icon_alex.png",
    "textures/ui/icon_steve.png",
];

const moduleList = Object.keys(config.modules).concat(Object.keys(config.misc_modules));
const modules = [];

for(const fullModule of moduleList) {
    if(fullModule.includes("example")) continue;
    const module = fullModule[fullModule.length - 1].toUpperCase() === fullModule[fullModule.length - 1] ? fullModule.slice(0, fullModule.length - 1) : fullModule;

    if(modules.includes(module)) continue;
    modules.push(module);
}

const punishments = {
    none: 0,
    mute: 1,
    kick: 2,
    ban: 3
};

// this is the function that will be called when the player wants to open the GUI
// all other GUI functions will be called from here
export function mainGui(player, error) {
    player.playSound("mob.chicken.plop");

    let text = `Hello ${player.name},\n\nPlease select an option below.`;
    if(error) text += `\n\n§c${error}`;

    const menu = new MinecraftUI.ActionFormData()
		.title("Scythe Anticheat UI")
		.body(text)
		.button("Ban Menu", "textures/ui/anvil_icon.png")
		.button("Configure Settings", "textures/ui/gear.png")
		.button(`Manage Players\n§8§o${[...world.getPlayers()].length} player(s) online`, "textures/ui/FriendsDiversity.png")
		.button("Exit", "textures/ui/redX1.png");

	if(config.debug) menu.button("⭐ Debug", "textures/ui/debug_glyph_color.png");

    menu.show(player).then((response) => {
        if(response.canceled) return;

        switch(response.selection) {
            case 0:
                banMenu(player);
                break;
            case 1:
                settingsMenu(player);
                break;
            case 2:
                playerSettingsMenu(player);
                break;
            case 3:
                break;
            case 4:
                debugSettingsMenu(player);
        }
    });
}

// ====================== //
//        Ban Menu        //
// ====================== //
function banMenu(player) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Ban Menu")
        .body("Please select an option.")
        .button("Kick Player", "textures/ui/anvil_icon.png")
        .button("Ban Player", "textures/ui/anvil_icon.png")
        .button("Unban Player", "textures/ui/anvil_icon.png")
        .button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        if(response.selection === 3 || response.canceled) return mainGui(player);

        if(response.selection === 2) return unbanPlayerMenu(player);

        banMenuSelect(player, response.selection);
    });
}

function banMenuSelect(player, selection) {
    player.playSound("mob.chicken.plop");
    const allPlayers = [...world.getPlayers()];

    const menu = createSelectPlayerMenu("Ban Menu", allPlayers, player);

    menu.show(player).then((response) => {
        if(response.selection === undefined) return banMenu(player);

        if(allPlayers.length > response.selection) {
            if(selection === 0) kickPlayerMenu(player, allPlayers[response.selection]);
                else if(selection === 1) banPlayerMenu(player, allPlayers[response.selection]);
        } else banMenu(player);
    });
}

function kickPlayerMenu(player, playerSelected, lastMenu = 0) {
    if(!config.customcommands.kick.enabled) return player.sendMessage("§r§6[§aScythe§6]§r Kicking players is disabled in config.js.");
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ModalFormData()
        .title("Kick Player Menu - " + playerSelected.name)
        .textField("Kick Reason:", "§o§7No Reason Provided")
        .toggle("Silent", false);

    menu.show(player).then((response) => {
        if(response.canceled) {
            switch (lastMenu) {
                case 0:
                    banMenuSelect(player, lastMenu);
                    break;
                case 1:
                    playerSettingsMenuSelected(player, playerSelected);
            }
            return;
        }

        const formValues = response.formValues ?? [];

        // @ts-expect-error
        const reason = formValues[0].replace(/"|\\/g, "") || "No Reason Provided";
        const isSilent = formValues[1];

        if(!isSilent) player.runCommandAsync(`kick "${playerSelected.name}" ${reason}`);
        playerSelected.triggerEvent("scythe:kick");

        tellAllStaff(`§r§6[§aScythe§6]§r ${player.nameTag} has kicked ${playerSelected.name} (Silent:${isSilent}). Reason: ${reason}`);
    });
}

function banPlayerMenu(player, playerSelected, lastMenu = 0) {
    if(!config.customcommands.kick.enabled) return player.sendMessage("§r§6[§aScythe§6]§r Banning players is disabled in config.js.");

    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ModalFormData()
        .title("Ban Player Menu - " + playerSelected.name)
        .textField("Ban Reason:", "§o§7No Reason Provided")
        .slider("Ban Length (in days)", 1, 365, 1)
        .toggle("Permanant Ban", false);
    menu.show(player).then((response) => {
        if(response.canceled) {
            if(lastMenu === 0) banMenuSelect(player, lastMenu);
                else if(lastMenu === 1) playerSettingsMenuSelected(player, playerSelected);

            return;
        }

        const formValues = response.formValues ?? [];

        // @ts-expect-error
        const reason = formValues[0].replace(/"|\\/g, "") || "No Reason Provided";
        const banLength = parseTime(`${formValues[1]}d`);
        const permBan = formValues[2];

        // remove old ban tags
        playerSelected.getTags().forEach(t => {
            t = t.replace(/"/g, "");
            if(t.startsWith("reason:") || t.startsWith("by:") || t.startsWith("time:")) playerSelected.removeTag(t);
        });
        
        playerSelected.addTag(`reason:${reason}`);
        playerSelected.addTag(`by:${player.nameTag}`);
        if(banLength && !permBan) playerSelected.addTag(`time:${Date.now() + banLength}`);
        playerSelected.addTag("isBanned");

        tellAllStaff(`§r§6[§aScythe§6]§r ${player.nameTag} has banned ${playerSelected.nameTag} for ${reason}`);
    });
}

function unbanPlayerMenu(player) {
    if(!config.customcommands.unban.enabled) return player.sendMessage("§r§6[§aScythe§6]§r Kicking players is disabled in config.js.");
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ModalFormData()
        .title("Unban Player Menu")
        .textField("Player to unban:", "§o§7Enter player name")
        .textField("Unban Reason:", "§o§7No Reason Provided");
    menu.show(player).then((response) => {
        if(response.canceled) return banMenu(player);

        const formValues = response.formValues ?? [];

        // @ts-expect-error
        const playerToUnban = formValues[0].split(" ")[0];
        // @ts-expect-error
        const reason = formValues[1].replace(/"|\\/g, "") || "No Reason Provided";

        // @ts-expect-error
        data.unbanQueue.push(playerToUnban.toLowerCase());

        tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has added ${playerToUnban} into the unban queue. Reason: ${reason}`);
    });
}

// ====================== //
//     Settings Menu      //
// ====================== //
function settingsMenu(player) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Configure Settings")
        .body("Please select a sub-check to edit.");

    for(const subModule of modules) {
        menu.button(capitalizeFirstLetter(subModule));
    }

    menu.button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        if(!modules[response.selection ?? -1]) return mainGui(player);

        settingsCheckSelectMenu(player, response.selection);
    });
}

function settingsCheckSelectMenu(player, selection) {
    player.playSound("mob.chicken.plop");
    const subCheck = modules[selection];

    const menu = new MinecraftUI.ActionFormData()
        .title("Configure Settings")
        .body("Please select a check to edit.");

    const checks = [];
    for(const module of moduleList) {
        if(!module.startsWith(subCheck)) continue;
        checks.push(module);

        const checkData = config.modules[module] ?? config.misc_modules[module];
        menu.button(`${capitalizeFirstLetter(subCheck)}/${module[module.length - 1]}\n${checkData.enabled ? "§8[§aENABLED§8]" : "§8[§4DISABLED§8]"}`);
    }

    if(checks.length === 1) return editSettingMenu(player, checks[0]);

    menu.button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        const selection = response.selection ?? - 1;

        if(!checks[selection]) return settingsMenu(player);

        editSettingMenu(player, checks[selection]);
    });
}

function editSettingMenu(player, check) {
    player.playSound("mob.chicken.plop");
    const checkData = config.modules[check] ?? config.misc_modules[check];

    let optionsMap = ["enabled"];

    const menu = new MinecraftUI.ModalFormData()
        .title(`Editing check: ${capitalizeFirstLetter(check)}`)
        .toggle("Enabled", checkData.enabled);

    for(const key of Object.keys(checkData)) {
        if(["enabled","punishment","punishmentLength","minVlbeforePunishment"].includes(key)) continue;

        // Friendly setting name. Changes "multi_protection" to "Multi Protection"
        const settingName = capitalizeFirstLetter(key).replace(/_./g, (match) => " " + match[1].toUpperCase());

        switch(typeof checkData[key]) {
            case "number":
                menu.slider(settingName, 0, 100, Number.isInteger(checkData[key]) ? 1 : 0.01, checkData[key]);
                optionsMap.push(key);
                break;
            case "boolean":
                menu.toggle(settingName, checkData[key]);
                optionsMap.push(key);
                break;
            case "string":
                menu.textField(settingName, "Enter text here", checkData[key]);
                optionsMap.push(key);
                break;
        }
    }

    // Check if the module supports punishments
    if(checkData.punishment) {
        menu.dropdown("Punishment", Object.keys(punishments), punishments[checkData.punishment]);
        menu.textField("Punishment Length", "Enter a length (ex: 12d, 1d, 1m, 30s", checkData["punishmentLength"]);
        menu.slider("Minimum Violations Before Punishment", 0, 20, 1, checkData["minVlbeforePunishment"]);

        optionsMap = optionsMap.concat(["punishment","punishmentLength","minVlbeforePunishment"]);
    }

    menu.show(player).then((response) => {
        if(response.canceled) return;

        const formValues = response.formValues ?? [];

        for(const id in optionsMap) {
            const name = optionsMap[id];

            // @ts-expect-error
            checkData[name] = name === "punishment" ? Object.keys(punishments)[formValues[id]] : formValues[id];
        }

        player.sendMessage(`§r§6[§aScythe§6]§r Successfully updated the settings for ${check}.\n§r§6[§aScythe§6]§r New Data:\n${JSON.stringify(checkData, null, 2)}`);
    });
}

// ====================== //
//       Player Menu      //
// ====================== //
function playerSettingsMenu(player) {
    player.playSound("mob.chicken.plop");
    const allPlayers = [...world.getPlayers()];

    const menu = createSelectPlayerMenu("Player Menu", allPlayers, player);

    menu.show(player).then((response) => {
        if(response.selection !== undefined && allPlayers.length > response.selection) {
            playerSettingsMenuSelected(player, allPlayers[response.selection]);
        } else {
            mainGui(player);
        }
    });
}

export function playerSettingsMenuSelected(player, playerSelected) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Player Menu - " + playerSelected.name)
        .body(`Managing ${playerSelected.name}.\n\nPlayer Info:\nCoordinates: ${Math.floor(playerSelected.location.x)}, ${Math.floor(playerSelected.location.y)}, ${Math.floor(playerSelected.location.z)}\nDimension: ${(playerSelected.dimension.id).replace("minecraft:", "")}\nScythe Opped: ${playerSelected.hasTag("op")}\nMuted: ${playerSelected.hasTag("isMuted")}\nFrozen: ${playerSelected.hasTag("freeze")}\nVanished: ${playerSelected.hasTag("vanish")}\nFlying: ${playerSelected.hasTag("flying")}`)
        .button("Clear EnderChest", "textures/blocks/ender_chest_front.png")
        .button("Kick Player", "textures/ui/anvil_icon.png")
        .button("Ban Player", "textures/ui/anvil_icon.png")
        .button(playerSelected.hasTag("flying") ? "Disable Fly Mode" : "Enable Fly Mode", "textures/ui/levitation_effect.png")
        .button(playerSelected.hasTag("freeze") ? "Unfreeze Player" : "Freeze Player", "textures/ui/icon_winter.png");

    if(!playerSelected.hasTag("isMuted")) {
        menu.button("Mute Player", "textures/ui/mute_on.png");
    } else {
        menu.button("Unmute Player", "textures/ui/mute_off.png");
    }

    if(!playerSelected.hasTag("op")) {
        menu.button("Set Player as Scythe-Op", "textures/ui/op.png");
    } else {
        menu.button("Remove Player as Scythe-Op", "textures/ui/permissions_member_star.png");
    }

    menu
        .button(playerSelected.hasTag("vanish") ? "Unvanish Player" : "Vanish Player", "textures/ui/invisibility_effect.png")
        .button("Teleport", "textures/ui/arrow.png")
        .button("Switch Gamemode", "textures/ui/op.png")
        .button("View Anticheat Logs", "textures/ui/WarningGlyph.png")
        .button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        switch (response.selection) {
            case 0: {
                if(!config.customcommands.ecwipe.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Enderchest wiping is disabled in config.js.");
                }

                wipeEnderchest(player, playerSelected);
                break;
            }
            case 1:
                kickPlayerMenu(player, playerSelected, 1);
                break;
            case 2:
                banPlayerMenu(player, playerSelected, 1);
                break;
            case 3:
                if(!config.customcommands.fly.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Toggling Fly is disabled in config.js.");
                }

                if(playerSelected.hasTag("flying")) {
                    playerSelected.runCommandAsync("function tools/fly");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has disabled fly mode for ${playerSelected.name}.`);

                    playerSettingsMenuSelected(player, playerSelected);
                } else {
                    playerSelected.runCommandAsync("function tools/fly");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has enabled fly mode for ${playerSelected.name}.`);

                    playerSettingsMenuSelected(player, playerSelected);
                }
                break;
            case 4:
                if(!config.customcommands.freeze.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Toggling Frozen State is disabled in config.js.");
                }

                if(playerSelected.hasTag("freeze")) {
                    playerSelected.runCommandAsync("function tools/freeze");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has unfrozen for ${playerSelected.name}.`);

                    playerSettingsMenuSelected(player, playerSelected);
                } else {
                    playerSelected.runCommandAsync("function tools/freeze");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has frozen for ${playerSelected.name}.`);

                    playerSettingsMenuSelected(player, playerSelected);
                }
                break;
            case 5:
                if(!config.customcommands.mute.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Muting players is disabled in config.js.");
                }

                if(playerSelected.hasTag("isMuted")) {
                    playerSelected.removeTag("isMuted");
                    playerSelected.runCommandAsync("ability @s mute false");
                }
                break;
            case 6:
                if(!config.customcommands.op.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Scythe-Opping players is disabled in config.js.");
                }

                if(playerSelected.hasTag("op")) {
                    removeOp(player, playerSelected);
                } else {
                    addOp(player, playerSelected);
                }
                break;
            case 7:
                if(!config.customcommands.vanish.enabled) {
                    return player.sendMessage("§r§6[§aScythe§6]§r Toggling Vanish is disabled in config.js.");
                }

                if(playerSelected.hasTag("vanished")) {
                    playerSelected.runCommandAsync("function tools/vanish");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has put ${playerSelected.name} into vanish.`);

                    playerSettingsMenuSelected(player, playerSelected);
                } else {
                    playerSelected.runCommandAsync("function tools/vanish");
                    tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} has unvanished ${playerSelected.name}.`);

                    playerSettingsMenuSelected(player, playerSelected);
                }
                break;
            case 8:
                playerSettingsMenuSelectedTeleport(player, playerSelected);
                break;
            case 9:
                playerSettingsMenuSelectedGamemode(player, playerSelected);
                break;
            case 10:
                playerSelected.runCommandAsync("function tools/stats");
                break;
            case 11:
                playerSettingsMenu(player);
                break;
        }

        if(response.canceled) playerSettingsMenu(player);
    });
}

function playerSettingsMenuSelectedTeleport(player, playerSelected) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Teleport Menu")
        .body(`Managing ${playerSelected.name}.`)
        .button("Teleport To", "textures/ui/arrow.png")
        .button("Teleport Here", "textures/ui/arrow_down.png")
        .button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        if(response.selection === 2 || response.canceled) return playerSettingsMenuSelected(player, playerSelected);
        
        switch(response.selection) {
            case 0:
                player.teleport(playerSelected.location);
                break;
            case 1:
                playerSelected.teleport(player.location);
        }
    });
}

function playerSettingsMenuSelectedGamemode(player, playerSelected) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Gamemode Menu")
        .body(`Switching ${playerSelected.name}'s gamemode.`)
        .button("Gamemode Survival", "textures/ui/permissions_member_star.png")
        .button("Gamemode Creative", "textures/ui/op.png")
        .button("Gamemode Adventure", "textures/ui/permissions_visitor_hand.png")
        .button("Gamemode Spectator", "textures/ui/invisibility_effect.png")
        .button("Default Gamemode", "textures/ui/lan_icon.png")
        .button("Back", "textures/ui/arrow_left.png");

    menu.show(player).then((response) => {
        if(response.selection === 5 || response.canceled) return playerSettingsMenuSelected(player, playerSelected);

        switch(response.selection) {
            case 3:
                playerSelected.runCommandAsync("gamemode spectator");
                break;
            
            case 4:
                playerSelected.runCommandAsync("gamemode 5");
                break;

            // Handles changing to survival, creative and adventure
            default:
                playerSelected.runCommandAsync(`gamemode ${response.selection}`);
        }
    });
}

// ====================== //
//       Debug Menu       //
// ====================== //
function debugSettingsMenu(player) {
    player.playSound("mob.chicken.plop");

    const menu = new MinecraftUI.ActionFormData()
        .title("Scythe Anticheat UI")
        .body(`Hello ${player.name},\n\nPlease select an option below.`)
        .button("Disable Debug Intents", "textures/ui/debug_glyph_color.png")
        .button("Randomize Inventory", "textures/ui/debug_glyph_color.png")
        .button("Force Watchdog Stack Overflow", "textures/ui/debug_glyph_color.png")
        .button("Force Watchdog Hang", "textures/ui/debug_glyph_color.png")
        .button("Force Watchdog Memory Crash Type 1", "textures/ui/debug_glyph_color.png")
        .button("Back", "textures/ui/arrow_left.png");
    menu.show(player).then((response) => {
        if(response.selection === 0) {
            config.debug = false;
            mainGui(player);
        } else if(response.selection === 1) {
            const container = player.getComponent("inventory").container;

            const totalItems = [];
            for (let i = 0; i < 36; i++) {
                if(container.getItem(i)?.nameTag === config.customcommands.ui.ui_item_name) continue;

                const allItems = [...Object.keys(Minecraft.MinecraftItemTypes)];
                const randomItemName = allItems[Math.floor(Math.random() * allItems.length)];
                const randomItem = Minecraft.MinecraftItemTypes[randomItemName];

                if(totalItems.includes(randomItem.id) || config.itemLists.cbe_items.includes(randomItem.id) || config.itemLists.items_semi_illegal.includes(randomItem.id) || config.itemLists.items_very_illegal.includes(randomItem.id) || randomItemName.includes("element")) {
                    i--;
                    continue;
                }
                totalItems.push(randomItem.id);

                container.setItem(i, new Minecraft.ItemStack(randomItem, 1));
            }
        } else if(response.selection === 2) {
            const troll = () => {
                troll();
            };
            troll();
        } else if(response.selection === 3) {
            // eslint-disable-next-line no-constant-condition
            while(true) {}
        } else if(response.selection === 4) {
            config.array = [config];
            // eslint-disable-next-line no-constant-condition
            while(true) {
                config.array.push(config);
            }
        } else if(response.selection === 6 || response.canceled) mainGui(player);
    });
}

// ====================== //
//         Extra          //
// ====================== //
function createSelectPlayerMenu(title, players, self) {
    const menu = new MinecraftUI.ActionFormData()
        .title(title)
        .body("Please select a player to manage.");

    for(const plr of players) {
        let playerName = plr.name;

        if(plr.id === self.id) playerName += " §1[YOU]";
        if(plr.hasTag("op")) playerName += " §1[OP]";

        menu.button(playerName, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
    }

    menu.button("Back", "textures/ui/arrow_left.png");

    return menu;
}