tp @s ~~~ facing 0 0 0
scoreboard players add @s anglevl 1
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(Player) §4BadPackets[1] (Invalid Viewing Angle). VL= "},{"score":{"name":"@s","objective":"anglevl"}}]}
