scoreboard objectives add killauravl dummy

scoreboard players add @s[type=player,tag=!left] killauravl 1
execute @s[type=player,tag=!left] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(Combat) §4KillAura/B. VL= "},{"score":{"name":"@s","objective":"killauravl"}}]}