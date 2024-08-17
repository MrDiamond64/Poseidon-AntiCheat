// @ts-check
import config from "./data/config.js";
import { world, system } from "@minecraft/server";
import { flag, banMessage, getScore, tellAllStaff, setScore } from "./util.js";
import { mainGui, playerSettingsMenuSelected } from "./features/ui.js";
import { commandHandler } from "./commands/handler.js";

let entitiesSpawnedInLastTick = 0;

world.beforeEvents.chatSend.subscribe((msg) => {
	const { sender: player, message } = msg;

	if(player.hasTag("isMuted")) {
		player.sendMessage("§r§6[§aScythe§6]§r §a§lNOPE! §r§aYou have been muted.");
		msg.cancel = true;
	}

	// BadPackets[2] = Checks for invalid chat message length
	if(config.modules.badpackets2.enabled && (message.length === 0 || message.length > config.modules.badpackets2.maxLength)) {
		system.runTimeout(() => {
			flag(player, "BadPackets", "2", "Exploit", `messageLength=${message.length}`, undefined, msg);
		}, 1);
		msg.cancel = true;
	}

	commandHandler(msg);

	// @ts-expect-error
	const globalmute = JSON.parse(world.getDynamicProperty("globalmute"));
	if(!msg.cancel && globalmute.muted && !player.hasTag("op")) {
		player.sendMessage(config.customcommands.globalmute.showModeratorName ? `§r§6[§aScythe§6]§r Chat has been disabled by ${globalmute.muter}` : "§r§6[§aScythe§6]§r Chat has been disabled by a server admin.");
		msg.cancel = true;
	}

	// Make sure that player has a custom nametag or filter unicode chat is enabled
	if(!msg.cancel && (player.name !== player.nameTag || config.misc_modules.filterUnicodeChat.enabled)) {
		// Adds user custom tags to their messages and filter any non-ASCII characters
		const playerTag = player.name !== player.nameTag ? `${player.nameTag}§7:§r` : `<${player.nameTag}>`;
		const message_ = config.misc_modules.filterUnicodeChat.enabled ? message.replace(/[^\x00-\xFF]/g, "") : message;

		world.sendMessage(`${playerTag} ${message_}`);
		msg.cancel = true;
	}
});

world.afterEvents.chatSend.subscribe(({ sender: player }) => {
	// Spammer/A = checks if someone sends a message while moving and on ground
	if(config.modules.spammerA.enabled && player.hasTag('moving') && player.isOnGround && !player.isJumping && !player.hasTag("riding")) {
		flag(player, "Spammer", "A", "Movement", undefined, true);
		return;
	}

	// Spammer/B = checks if someone sends a message while swinging their hand
	if(config.modules.spammerB.enabled && player.hasTag('left') && !player.getEffect("mining_fatigue")) {
		flag(player, "Spammer", "B", "Combat");
		return;
	}

	// Spammer/C = checks if someone sends a message while using an item
	if(config.modules.spammerC.enabled && player.hasTag('right')) {
		flag(player, "Spammer", "C", "Misc");
		return;
	}

	// Spammer/D = checks if someone sends a message while having a GUI open
	if(config.modules.spammerD.enabled && player.hasTag('hasGUIopen')) {
		flag(player, "Spammer", "D", "Misc");
		return;
	}

	if(config.modules.spammerE.enabled) {
		const now = Date.now();

		const lastMessageSent = now - player.lastMessageSent;
		if(lastMessageSent < config.modules.spammerE.messageRatelimit) {
			flag(player, "Spammer", "E", "Misc", `lastMessageSent=${lastMessageSent}`);

			if(config.modules.spammerE.sendWarningMessage) player.sendMessage("§r§6[§aScythe§6]§r Stop spamming! You are sending messages too fast.");
			return;
		}
		player.lastMessageSent = now;
	}
});

system.runInterval(() => {
	const now = Date.now();
	if(config.misc_modules.itemSpawnRateLimit.enabled) entitiesSpawnedInLastTick = 0;

	// Run as each player
	for(const player of world.getPlayers()) {
		try {
			player.velocity = player.getVelocity();
			player.rotation = player.getRotation();

			// Sexy looking ban message
			if(player.getDynamicProperty("banInfo")) banMessage(player);

			if(config.modules.nukerA.enabled && player.blocksBroken >= 1) player.blocksBroken = 0;
			if(config.modules.killauraC.enabled && player.entitiesHit?.length >= 1) player.entitiesHit = [];
			if(config.modules.autotoolA.enabled && now - player.startBreakTime < config.modules.autotoolA.startBreakDelay && player.lastSelectedSlot !== player.selectedSlotIndex) {
				player.flagAutotoolA = true;
				player.autotoolSwitchDelay = now - player.startBreakTime;
			}

			/*
			// Crasher/A = invalid pos check
			if(config.modules.crasherA.enabled && Math.abs(player.location.x) > 30000000 ||
				Math.abs(player.location.y) > 30000000 || Math.abs(player.location.z) > 30000000)
					flag(player, "Crasher", "A", "Exploit", `x_pos=${player.location.x},y_pos=${player.location.y},z_pos=${player.location.z}`, true);
			*/

			// Find the magnitude of the vector
			const playerSpeed = Number(Math.sqrt(player.velocity.x**2 + player.velocity.z**2).toFixed(2));

			// NoSlow/A = Speed limit check
			if(config.modules.noslowA.enabled && playerSpeed >= config.modules.noslowA.speed && playerSpeed <= config.modules.noslowA.maxSpeed && player.isOnGround && !player.isJumping && !player.isGliding && !player.getEffect("speed") && player.hasTag('right') && !player.hasTag("trident") && !player.hasTag("riding")) {
				const right = getScore(player, "right");
				const blockBelow = player.dimension.getBlock({x: player.location.x, y: player.location.y - 1, z: player.location.z});

				// Get the item that the player is holding
				const container = player.getComponent("inventory")?.container;
				const heldItemId = container?.getItem(player.selectedSlotIndex)?.typeId ?? "minecraft:air";

				// Make sure there are no entities below the player
				const nearbyEntities = player.dimension.getEntitiesAtBlockLocation(player.location);

				if(blockBelow && right >= 10 && !nearbyEntities.find(entity => entity.typeId !== "minecraft:player") && !blockBelow.typeId.includes("ice")) {
					flag(player, "NoSlow", "A", "Movement", `speed=${playerSpeed},heldItem=${heldItemId},blockBelow=${blockBelow.typeId},rightTicks=${right}`, true);
				}
			}

			// InvalidSpring/A = Checks for sprinting with the blindness effect
			if(config.modules.invalidsprintA.enabled && player.isSprinting && player.getEffect("blindness"))
				flag(player, "InvalidSprint", "A", "Movement", undefined, true);

			// Fly/a
			// This check no longer works.
			/*
			if(config.modules.flyA.enabled && Math.abs(player.velocity.y).toFixed(4) === "0.1552" && !player.isJumping && !player.isGliding && !player.hasTag("riding") && !player.getEffect("levitation") && player.hasTag("moving")) {
				const pos1 = {x: player.location.x - 2, y: player.location.y - 1, z: player.location.z - 2};
				const pos2 = {x: player.location.x + 2, y: player.location.y + 2, z: player.location.z + 2};

				const isInAir = !getBlocksBetween(pos1, pos2).some((block) => player.dimension.getBlock(block)?.typeId !== "minecraft:air");

				if(isInAir) flag(player, "Fly", "A", "Movement", `vertical_speed=${Math.abs(player.velocity.y).toFixed(4)}`, true);
					else if(config.debug) console.warn(`${new Date().toISOString()} | ${player.name} was detected with flyA motion but was found near solid blocks.`);
			}
			*/

			if(config.modules.autoclickerA.enabled && player.cps > 0 && now - player.firstAttack >= config.modules.autoclickerA.checkCPSAfter) {
				const cps = player.cps / ((now - player.firstAttack) / config.modules.autoclickerA.checkCPSAfter);

				// Autoclicker/A = Check for high cps
				if(cps > config.modules.autoclickerA.maxCPS) flag(player, "Autoclicker", "A", "Combat", `cps=${cps}`);

				player.firstAttack = now;
				player.cps = 0;
			}

			// BadPackets[4] = checks for invalid selected slot
			// The handler for the player hotbar packet runs a function called PlayerInventory::selectSlot. This function checks for invalid selected slot
			// thus making this check useless.
			/*
			if(config.modules.badpackets4.enabled && selectedSlot < 0 || selectedSlot > 8) {
				flag(player, "BadPackets", "4", "Exploit", `selectedSlot=${selectedSlot}`);
				player.selectedSlotIndex = 0;
			}
			*/

			if(player.location.y < -104) player.tryTeleport({x: player.location.x, y: -104, z: player.location.z});

			/*
			// The 'fallDistance' property in Player has been removed.
			if(config.modules.flyB.enabled && player.fallDistance < -1 && !player.isSwimming && !player.isJumping && !player.hasTag("trident")) {
				flag(player, "Fly", "B", "Movement", `fallDistance=${player.fallDistance}`, true);
			}
			*/

			if(config.misc_modules.worldborder.enabled && (Math.abs(player.location.x) > config.misc_modules.worldborder.max_x || Math.abs(player.location.z) > config.misc_modules.worldborder.max_z) && !player.hasTag("op")) {
				/*
				player.applyKnockback(
					// Check if the number is greater than 0, if it is then subtract 1, else add 1
					player.location.x >= 0 ? -1 : 1,
					player.location.z >= 0 ? -1 : 1,
					0.5,
					0.05
				);
				*/

				player.tryTeleport({
					// Check if the number is greater than 0, if it is then subtract 1 else add 1
					x: player.location.x - (player.location.x >= 0 ? 1 : -1),
					y: player.location.y,
					z: player.location.z - (player.location.z >= 0 ? 1 : -1)
				}, {
					checkForBlocks: false
				});

				player.sendMessage("§r§6[§aScythe§6]§r You have reached the world border.");
			}

			if(player.getDynamicProperty("vanished")) player.onScreenDisplay.setActionBar("§aYOU ARE VANISHED!")

			// Store the players last good position
			// When a movement-related check flags the player, they will be teleported to this position
			// xRot and yRot being 0 means the player position was modified from player.teleport, which we should ignore
			if(player.rotation.x !== 0 && player.rotation.y !== 0) player.lastGoodPosition = player.location;
		} catch (error) {
			console.error(error, error.stack);
			if(player.hasTag("errorlogger")) tellAllStaff(`§r§6[§aScythe§6]§r There was an error while running the tick event. Please forward this message to https://discord.gg/9m9TbgJ973.\n-------------------------\n${error}\n${error.stack || "\n"}-------------------------`, ["errorlogger"]);
		}
	}
}, 1);

world.afterEvents.playerPlaceBlock.subscribe(({ block, player }) => {
	if(config.debug) console.warn(`${player.name} has placed ${block.typeId}. Player Tags: ${player.getTags()}`);

	// Get block under player
	const blockUnder = player.dimension.getBlock({x: Math.trunc(player.location.x), y: Math.trunc(player.location.y) - 1, z: Math.trunc(player.location.z)});

	// Scaffold/A = Check for Tower like behavior
	if(
		config.modules.scaffoldA.enabled &&
		!player.isFlying &&
		player.isJumping &&
		player.velocity.y < 1 &&
		// player.fallDistance < 0 &&
		block.location.x === blockUnder?.location.x &&
		block.location.y === blockUnder?.location.y &&
		block.location.z === blockUnder?.location.z &&
		!player.getEffect("jump_boost") &&
		!block.typeId.includes("fence") &&
		!block.typeId.includes("wall") &&
		!block.typeId.includes("_shulker_box")
	) {
		const yPosDiff = Math.abs(player.location.y % 1);

		if(yPosDiff > config.modules.scaffoldA.max_y_pos_diff && player.gamemode !== "creative" && !player.hasTag("flying")) {
			flag(player, "Scaffold", "A", "World", `yPosDiff=${yPosDiff},block=${block.typeId}`, true);
			block.setType("air");
		}
	}

	// Credit to the dev of Isolate Anticheat for giving me the idea of checking if a player x rotation is 60 to detect horion scaffold
	// The check was later updated to check if the x rotation or the y rotation is a flat number to further detect any other aim related hacks
	if(config.modules.scaffoldB.enabled && ((Number.isInteger(player.rotation.x) && player.rotation.x !== 0) || (Number.isInteger(player.rotation.y) && player.rotation.y !== 0))) {
		flag(player, "Scaffold", "B", "World", `xRot=${player.rotation.x},yRot=${player.rotation.y}`, true);
		block.setType("air");
	}

	// Scaffold/C = Check if a player placed a block under them whilst looking up
	// Make sure the players's y location is greater than the block placed's y location.
	if(config.modules.scaffoldC.enabled && Math.trunc(player.location.y) > Math.trunc(block.location.y) && player.rotation.x < config.modules.scaffoldC.min_x_rot && !player.isSwimming && block.isSolid && !player.hasTag("riding")) {
		flag(player, "Scaffold", "C", "World", `xRot=${player.rotation.x},yPosPlayer=${player.location.y},yPosBlock=${block.location.y}`);
		block.setType("air");
	}

	// Scaffold/D = Check for downwards scaffold
	// This checks if a player places a block under the block they are currently standing on
	if(
		config.modules.scaffoldD.enabled &&
		blockUnder?.isSolid &&
		Math.trunc(player.location.x) === block.location.x &&
		(Math.trunc(player.location.y) - 2) === block.location.y &&
		Math.trunc(player.location.z) === block.location.z
	) {
		flag(player, "Scaffold", "D", "World", `playerYpos=${player.location.y},blockXpos=${block.location.x},blockYpos=${block.location.y},blockZpos=${block.location.z}`);
		block.setType("air");
	}

	// Scaffold/E = Checks for placing blocks onto air or liquid tiles
	if(config.modules.scaffoldE.enabled) {
		const surroundingBlocks = [
			block.above(),
			block.below(),
			block.north(),
			block.east(),
			block.south(),
			block.west()
		];

		// TODO: Properly handle placing lilypads on water without flags
		if(!surroundingBlocks.some(adjacentBlock => adjacentBlock && !adjacentBlock.isAir/* && !adjacentBlock.isLiquid*/)) {
			flag(player, "Scaffold", "E", "World");
			block.setType("air");
		}
	}
});

world.afterEvents.playerBreakBlock.subscribe(({ player, dimension, block, brokenBlockPermutation }) => {
	const brokenBlockId = brokenBlockPermutation.type.id;

	let revertBlock = false;

	if(config.debug) console.warn(`${player.name} has broken the block ${brokenBlockId}`);

	// Nuker/a = checks if a player breaks more than 3 blocks in a tick
	if(config.modules.nukerA.enabled && ++player.blocksBroken > config.modules.nukerA.maxBlocks) {
		flag(player, "Nuker", "A", "World", `blocksBroken=${player.blocksBroken}`);
		revertBlock = true;
	}

	// Autotool/A = checks for player slot mismatch
	if(config.modules.autotoolA.enabled && player.flagAutotoolA && player.gamemode !== "creative") {
		flag(player, "AutoTool", "A", "World", `selectedSlot=${player.selectedSlotIndex},lastSelectedSlot=${player.lastSelectedSlot},switchDelay=${player.autotoolSwitchDelay}`);
		revertBlock = true;
	}

	/*
		InstaBreak/A = checks if a player in survival breaks an unbreakable block
		While the InstaBreak method used in Horion and Zephyr are patched, there are still some bypasses
		that can be used
	*/
	if(config.modules.instabreakA.enabled && config.modules.instabreakA.unbreakable_blocks.includes(brokenBlockId) && player.gamemode !== "creative") {
		flag(player, "InstaBreak", "A", "Exploit", `block=${brokenBlockId}`);
		revertBlock = true;
	}

	if(config.misc_modules.oreAlerts.enabled && config.misc_modules.oreAlerts.blocks.includes(brokenBlockId) && !player.hasTag("op")) {
		tellAllStaff(`§r§6[§aScythe§6]§r [Ore Alerts] ${player.name} has broken 1x ${brokenBlockId}`, ["notify"]);
	}

	if(revertBlock) {
		// Remove the dropped items
		const droppedItems = dimension.getEntities({
			location: block.location,
			minDistance: 0,
			maxDistance: 2,
			type: "item"
		});

		for(const item of droppedItems) item.remove();

		block.setPermutation(brokenBlockPermutation);
	}
});

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
	if(!initialSpawn) return;

	// Declare all needed variables
	if(config.modules.nukerA.enabled) player.blocksBroken = 0;
	if(config.modules.autoclickerA.enabled) {
		player.firstAttack = Date.now();
		player.cps = 0;
	}
	if(config.modules.fastuseA.enabled) player.lastThrow = 0;
	if(config.modules.killauraC.enabled) player.entitiesHit = [];
	if(config.modules.spammerE.enabled) player.lastMessageSent = 0;
	if(config.customcommands.report.enabled) player.reports = [];
	if(config.modules.killauraB.enabled) player.lastLeftClick = NaN;

	player.lastGoodPosition = player.location;

	// Remove tags from previous session
	player.removeTag("hasGUIopen");
	player.removeTag("right");
	player.removeTag("left");
	// player.removeTag("gliding");
	player.removeTag("sprinting");
	player.removeTag("moving");
	player.removeTag("sleeping");

	// Patch a method of disabling anticheats
	player.nameTag = player.nameTag.replace(/[^A-Za-z0-9_\-() ]/gm, "").trim();

	// Load custom nametags
	const { mainColor, borderColor, playerNameColor, defaultTag } = config.customcommands.tag;

	// Backwards compatibility
	let reason;
	let by;
	let time;

	for(const tag of player.getTags()) {
		switch(tag.split(":")[0]) {
			case "tag":
				player.setDynamicProperty("tag", tag.slice(4));
				player.removeTag(tag);
				break;

			case "reason":
				reason = tag;
				player.removeTag(tag);
				break;

			case "by":
				by = tag;
				player.removeTag(tag);
				break;

			case "time":
				time = tag;
				player.removeTag(tag);
				break;
		}
	}

	let tag = player.getDynamicProperty("tag");

	// Add default tag if enabled
	if(!tag && defaultTag) tag = defaultTag;

	if(tag) player.nameTag = `${borderColor}[§r${mainColor}${tag}${borderColor}]§r ${playerNameColor}${player.nameTag}`;

	if(reason && by && time) {
		player.setDynamicProperty("banInfo", JSON.stringify({
			by: by.slice(3),
			reason: reason.slice(7),
			time: time ? Number(time.slice(5)) : null
		}));
	}

	// Namespoof/A = username length check.
	if(config.modules.namespoofA.enabled) {
		let flagNamespoofA = false;
		// checks if 2 players are logged in with the same name
		// minecraft adds a suffix to the end of the name which we detect
		if(player.name.endsWith(")") && (player.name.length > config.modules.namespoofA.maxNameLength + 3 || player.name.length < config.modules.namespoofA.minNameLength))
			flagNamespoofA = true;

		if(!player.name.endsWith(")") && (player.name.length < config.modules.namespoofA.minNameLength || player.name.length > config.modules.namespoofA.maxNameLength))
			flagNamespoofA = true;

		if(flagNamespoofA) {
			const extraLength = player.name.length - config.modules.namespoofA.maxNameLength;
			player.nameTag = player.name.slice(0, -extraLength) + "...";

			flag(player, "Namespoof", "A", "Exploit", `nameLength=${player.name.length}`);
		}
	}

	// Namespoof/B = Regex check
	if(config.modules.namespoofB.enabled && RegExp(config.modules.namespoofB.regex).test(player.name)) {
		flag(player, "Namespoof", "B", "Exploit");
	}

	// This is used in the onJoin.json animation to check if Beta APIs are enabled
	setScore(player, "gametestapi", 1);

	// @ts-expect-error
	const globalmute = JSON.parse(world.getDynamicProperty("globalmute"));
	if(globalmute.muted && player.hasTag("op")) player.sendMessage(`§r§6[§aScythe§6]§r NOTE: Chat has been currently disabled by ${globalmute.muter}. Chat can be re-enabled by running the !globalmute command.`);

	if(config.misc_modules.welcomeMessage.enabled) {
		player.sendMessage(config.misc_modules.welcomeMessage.message.replace(/\[@player]/g, player.name));
	}
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
	// If the entity dies right before this event triggers, an error will be thrown if any property is accessed
	if(!entity.isValid()) return;

	if(config.misc_modules.itemSpawnRateLimit.enabled && ++entitiesSpawnedInLastTick > config.misc_modules.itemSpawnRateLimit.entitiesBeforeRateLimit) {
		if(config.debug) console.warn(`Killed "${entity.typeId}" due to entity spawn ratelimit reached.`);
		entity.remove();
	}

	if(config.misc_modules.antiArmorStandCluster.enabled && entity.typeId === "minecraft:armor_stand") {
		const entities = entity.dimension.getEntities({
			location: entity.location,
			maxDistance: config.misc_modules.antiArmorStandCluster.radius,
			type: "armor_stand"
		});

		if(entities.length > config.misc_modules.antiArmorStandCluster.max_armor_stand_count) {
			tellAllStaff(`§r§6[§aScythe§6]§r Potential lag machine detected at X: ${~entity.location.x}, Y: ${~entity.location.y}, Z: ${~entity.location.z}. There are ${entities.length}/${config.misc_modules.antiArmorStandCluster.max_armor_stand_count} armor stands in this area.`, ["notify"]);

			for(const entityLoop of entities) {
				entityLoop.remove();
			}
		}
	}
});

world.afterEvents.entityHitEntity.subscribe(({ hitEntity: entity, damagingEntity: player}) => {
	// Hitting an end crystal causes an error when trying to get the entity location. isValid() fixes that
	if(player.typeId !== "minecraft:player" || !entity.isValid()) return;

	tellAllStaff(`§߈§r§6[§aScythe§6]§r §breceived §aATTACK§r action from: §g${player.name} §7(isSprinting=${player.isSprinting})`, ["actionlogger"])

	// Reach/A = Check if a player hits an entity farther than normally possible
	if(config.modules.reachA.enabled) {
		// Use the Euclidean Distance Formula to determine the distance between two 3-dimensional objects
		const distance = Math.sqrt((entity.location.x - player.location.x)**2 + (entity.location.y - player.location.y)**2 + (entity.location.z - player.location.z)**2);

		if(config.debug) console.warn(`${player.name} attacked ${entity.nameTag ?? entity.typeId} with a distance of ${distance}`);

		if(
			distance > config.modules.reachA.reach &&
			entity.typeId.startsWith("minecraft:") &&
			!config.modules.reachA.entities_blacklist.includes(entity.typeId) &&
			player.gamemode !== "creative"
		) {
			flag(player, "Reach", "A", "Combat", `entity=${entity.typeId},distance=${distance}`);
		}
	}

	// BadPackets[3] = checks if a player attacks themselves
	// Some (bad) hacks use this to bypass anti-movement cheat checks
	if(config.modules.badpackets3.enabled && entity.id === player.id) flag(player, "BadPackets", "3", "Exploit");

	// Check if the player was hit with the UI item, and if so open the UI for that player
	if(config.customcommands.ui.enabled && entity.typeId === "minecraft:player" && !config.customcommands.ui.requiredTags.some(tag => !player.hasTag(tag))) {
		const container = player.getComponent("inventory")?.container;
		if(!container) return; // This should not happen

		const item = container.getItem(player.selectedSlotIndex);
		if(item?.typeId === config.customcommands.ui.ui_item && item?.nameTag === config.customcommands.ui.ui_item_name) {
			playerSettingsMenuSelected(player, entity);
		}
	}

	// Autoclicker/A = Check for high CPS. The rest of the handling is in the tick event
	if(config.modules.autoclickerA.enabled) player.cps++;

	// Killaura/A = Check if a player attacks an entity while using an item
	if(config.modules.killauraA.enabled && player.hasTag("right")) {
		const rightTicks = getScore(player, "right");

		if(rightTicks > config.modules.killauraA.rightTicks) {
			flag(player, "Killaura", "A", "Combat", `ticks=${rightTicks}`);
		}
	}

	/**
	 * Killaura/B = Check for no swing
	 * For this check to work correctly Scythe has to be put at the top of the behavior packs list
	 * Players with the haste effect are excluded as the effect can make players not swing their hand
	 */
	if(config.modules.killauraB.enabled && !player.hasTag("trident") && !player.getEffect("haste")) {
		system.runTimeout(() => {
			const swingDelay = Date.now() - player.lastLeftClick;

			if(swingDelay > config.modules.killauraB.max_swing_delay) {
				flag(player, "Killaura", "B", "Combat", `swingDelay=${swingDelay}`);
			}
		}, config.modules.killauraB.wait_ticks);
	}

	// Killaura/C = Check for multi-aura
	if(config.modules.killauraC.enabled && !player.entitiesHit.includes(entity.id)) {
		player.entitiesHit.push(entity.id);

		if(player.entitiesHit.length >= config.modules.killauraC.entities) {
			flag(player, "KillAura", "C", "Combat", `entitiesHit=${player.entitiesHit.length}`);
		}
	}

	// Kilaura/D = Check if the player attacks an entity while sleeping
	if(config.modules.killauraD.enabled && player.hasTag("sleeping")) {
		flag(player, "Killaura", "D", "Combat");
	}

	// Killaura/E = Check if the player attacks an entity while having a container open
	if(config.modules.killauraE.enabled && player.hasTag("hasGUIopen")) {
		flag(player, "Killaura", "E", "Combat");
	}

	if(config.debug) console.warn(player.getTags());
});

world.afterEvents.entityHitBlock.subscribe(({ damagingEntity: player}) => {
	player.flagAutotoolA = false;
	player.lastSelectedSlot = player.selectedSlotIndex;
	player.startBreakTime = Date.now();
	player.autotoolSwitchDelay = 0;
});

world.beforeEvents.itemUse.subscribe((itemUse) => {
	const { source: player } = itemUse;

	if(player.typeId !== "minecraft:player") return;

	if(config.modules.fastuseA.enabled) {
		const now = Date.now();

		const lastThrowTime = now - player.lastThrow;
		if(lastThrowTime > config.modules.fastuseA.min_use_delay && lastThrowTime < config.modules.fastuseA.max_use_delay) {
			// flag(player, "FastUse", "A", "Combat", `lastThrowTime=${lastThrowTime}`);
			itemUse.cancel = true;
		}
		player.lastThrow = now;
	}

	// Patch bypasses for the freeze system
	if(player.hasTag("freeze")) itemUse.cancel = true;
});

world.afterEvents.itemUse.subscribe(({ itemStack: item, source: player }) => {
	// itemUse can be triggered from entities
	if(player.typeId !== "minecraft:player") return;

	if(config.customcommands.ui.enabled && item.typeId === config.customcommands.ui.ui_item && item.nameTag === config.customcommands.ui.ui_item_name && !config.customcommands.ui.requiredTags.some(tag => !player.hasTag(tag))) {
		mainGui(player);
	}
});

world.afterEvents.playerGameModeChange.subscribe(({fromGameMode, player, toGameMode}) => {
	player.gamemode = toGameMode;

	if(
		!config.misc_modules.antiGamemode.enabled ||
		// @ts-expect-error
		!config.misc_modules.antiGamemode.blockedGamemodes.includes(toGameMode) ||
		player.hasTag("op")
	) return;

	// Player entered a blocked gamemode
	player.setGameMode(fromGameMode);
	tellAllStaff(`§r§6[§aScythe§6]§r ${player.name}§r §4tried changing their gamemode to a blocked gamemode §7(oldGamemode=${fromGameMode},newGamemode=${toGameMode})§4.`, ["notify"]);
});

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity }) => {
	if(!sourceEntity || !id.startsWith("scythe:")) return;

	const splitId = id.split(":");
	switch(splitId[1]) {
		case "left":
			sourceEntity.lastLeftClick = Date.now();
	}
});

system.beforeEvents.watchdogTerminate.subscribe((watchdogTerminate) => {
	// We try to stop any watchdog crashes incase malicious users try to make the scripts lag
	// and causing the server to crash
	watchdogTerminate.cancel = true;

	tellAllStaff(`§r§6[§aScythe§6]§r A Watchdog Exception has been detected and has been cancelled successfully. Reason: ${watchdogTerminate.terminateReason}`);
});

// When using /reload, the variables defined in playerSpawn event do not persist so we reapply them.
for(const player of world.getPlayers()) {
	if(config.modules.nukerA.enabled) player.blocksBroken = 0;
	if(config.modules.autoclickerA.enabled) {
		player.firstAttack = Date.now();
		player.cps = 0;
	}
	if(config.modules.fastuseA.enabled) player.lastThrow = 0;
	if(config.modules.killauraC.enabled) player.entitiesHit = [];
	if(config.modules.spammerE.enabled) player.lastMessageSent = 0;
	if(config.customcommands.report.enabled) player.reports = [];
	if(config.modules.killauraB.enabled) player.lastLeftClick = NaN;

	player.gamemode = player.getGameMode();
	player.lastGoodPosition = player.location;
}