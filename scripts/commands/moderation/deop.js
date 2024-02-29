import { findPlayerByName, removeOp } from "../../util.js";
import { registerCommand } from "../handler.js";

registerCommand({
    name: "deop",
    description: "Remove Scythe-OP from a specific player",
    usage: "<player>",
    minArgCount: 1,
    category: "moderation",
    execute: (message, args) => {
        const { player } = message;

        // Find the player requested
        const member = findPlayerByName(args[0]);

        if(!member) return player.sendMessage("§r§6[§aScythe§6]§r Couldn't find that player.");

        if(!member.hasTag("op")) return player.sendMessage("§r§6[§aScythe§6]§r This player does not have scythe-op.");

        removeOp(player, member);
    }
});