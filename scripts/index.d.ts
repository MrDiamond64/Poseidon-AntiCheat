import { Player, Entity, EntityComponent, Container, ItemComponent, Vector2, Vector3 } from "@minecraft/server";

declare module "@minecraft/server" {
	interface Player {
		// Booleans
		flagAutotoolA: boolean

		// Numbers
		blocksBroken: number
		startBreakTime: number
		lastSelectedSlot: number
		autotoolSwitchDelay: number
		cps: number
		firstAttack: number
		lastThrow: number
		lastMessageSent: number

		// Arrays
		entitiesHit: Array<String>
		reports: Array<String>
		
		// Objects
		lastGoodPosition: Vector3
		velocity: Vector3
		rotation: Vector2
	}

	interface Entity {
		// Booleans
		flagAutotoolA: boolean

		// Strings
		name: string

		// Numbers
		cps: number,
		selectedSlot: number
		lastThrow: number
		startBreakTime: number
		lastSelectedSlot: number
		autotoolSwitchDelay: number
		lastMessageSent: number
		lastLeftClick: number

		// Arrays
		entitiesHit: Array<String>
	}
}