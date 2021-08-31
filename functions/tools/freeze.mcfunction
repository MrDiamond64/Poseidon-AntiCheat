tag @s[tag=freeze] add nofreeze
tag @s[tag=nofreeze] remove freeze
effect @s[tag=nofreeze] clear
tellraw @s[tag=nofreeze] {"rawtext":[{"text":"§r§6[§aScythe§6] §r You are no longer frozen!"}]}
execute @s[tag=nofreeze] ~~~ detect ~ ~+2 ~ barrier 0 setblock ~ ~+2 ~ air
execute @s[tag=nofreeze] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §rIs no longer frozen."}]}

effect @s[tag=!nofreeze] slowness 9999 250 true
effect @s[tag=!nofreeze] weakness 9999 250 true
effect @s[tag=!nofreeze] mining_fatigue 9999 250 true
effect @s[tag=!nofreeze] blindness 9999 250 true
execute @s[tag=!nofreeze] ~~~ detect ~ ~+2 ~ air 0 setblock ~ ~+2 ~ barrier
tag @s[tag=!nofreeze] add freeze
execute @s[tag=freeze,tag=!nofreeze] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §rHas been frozen"}]}


tag @s[tag=nofreeze] remove nofreeze