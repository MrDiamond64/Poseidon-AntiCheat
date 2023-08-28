import { Player, Entity, EntityComponent, Container, ItemComponent, EnchantmentList } from "@minecraft/server";

declare module "@minecraft/server" {
	interface Player {
		Player,

		// Booleans
		isGlobalBanned: boolean,
		flagAutotoolA: boolean,
		flagNamespoofA: boolean,
		flagNamespoofB: boolean,

		// Numbers
		blocksBroken: number,
		startBreakTime: number,
		lastSelectedSlot: number,
		autotoolSwitchDelay: number,
		cps: number,
		firstAttack: number,
		lastThrow: number

		// Arrays
		entitiesHit: Array<String>,
		reports: Array<String>
	}

	interface Entity {
		Entity,
		
		// Booleans
		flagAutotoolA: boolean,


		// Strings
		name: string,

		// Numbers
		cps: number,
		selectedSlot: number,
		lastThrow: number,
		startBreakTime: number,
		lastSelectedSlot: number,
		autotoolSwitchDelay: number,

		// Arrays
		entitiesHit: Array<String>
	}
}