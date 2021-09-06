# Clears illegal items from player inventories

scoreboard objectives add illegalitemsvl dummy
scoreboard players add @s illegalitemsvl 0

# spawn_eggs
clear @a[tag=!op,m=!c] spawn_egg

# skull3
clear @a[tag=skull3,tag=!op,m=!c] skull 3

kill @e[type=chalkboard]

# clear dropped items
kill @e[type=item,name="Bedrock"]
kill @e[type=item,name="End Portal"]
kill @e[type=item,name="Command Block"]
kill @e[type=item,name="Chain Command Block"]
kill @e[type=item,name="Repeating Command Block"]
kill @e[type=item,name="Minecart with Command Block"]
kill @e[type=item,name="Barrier"]
kill @e[type=item,name="Structure Block"]
kill @e[type=item,name="Structure Void"]
kill @e[type=item,name="Jigsaw Block"]
kill @e[type=item,name="Allow"]
kill @e[type=item,name="Deny"]
kill @e[type=item,name="Light Block"]
kill @e[type=item,name="Border"]
kill @e[type=item,name="Compound Creator"]
kill @e[type=item,name="Frosted Ice"]
