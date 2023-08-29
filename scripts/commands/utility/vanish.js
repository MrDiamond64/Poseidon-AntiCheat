import { tellAllStaff } from "../../util.js";
import { registerCommand } from "../handler.js";

registerCommand({
    name: "vanish",
    execute: (message) => {
        const player = message.sender;

        if(player.hasTag("vanish")) {
            player.removeTag("vanish");

            // Gamemode 5 = default gamemode
            player.runCommandAsync("gamemode 5");

            player.sendMessage("§r§6[§aScythe§6]§r You are now no longer vanished.");
            tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} is no longer vanished.`);
        } else {
            player.addTag("vanish");

            player.runCommandAsync("gamemode spectator");

            player.sendMessage("§r§6[§aScythe§6]§r You are now vanished.");
            tellAllStaff(`§r§6[§aScythe§6]§r ${player.name} is now vanished.`);
        }
    }
});