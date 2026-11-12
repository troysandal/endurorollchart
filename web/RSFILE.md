# RS File Format
RS (Route Sheet) files are line oriented files where each line is either a comment, an action or empty.  Each line is read in order and appended to the route.  Lap is not indicated in RS files, it is implicitly given by reset_0.

## Actions
Actions are route actions such as speed changes, resets, gas stops, etc.  Every action has an associated mileage and at most one optional parameter.  For example, a speed change takes a speed as it's parameter.

Example
> `action mileage [parameter]`

There are 15 actions in RS files: title, title2, title3, keytime, speed, reset, free_time, break, note, reset_0, gas_stop, known, free_zone, start, end. Note that some actions mileage *must be on a possible* as noted below.  You'll see an error in the route sheet if they are not.  Also note that free_time and break appear to be identical in nature and are treated as such.

### Action Descriptions
```
title enduro_title
title2 enduro_title
title3 enduro_title
keytime hour_minute
speed possible_mileage speed
reset mileage new_mileage
free_time mileage free_time_in_minutes
break mileage free_time_in_minutes
note mileage message_to_riders
reset_0 possible_mileage
gas_stop mileage
known mileage
free_zone mileage free_until
start mileage
end possible_mileage
```

## Comments
Comment lines start with a # sign and continue until end of line.

Example
> `# this is a comment in an RS file`


## Example Route Sheet
```
# This is a very simple route sheet that illustrates every action.
title Big Enduro
title2 06-15-2015
title3 Hollister, CA
keytime 08:30
speed  0.00  30
reset   3.31   3.96
free_time   4.00   5
note   4.30 sadf
break   5.00   2
reset_0   9.00
gas_stop   3.00
known   7.00
note   7.00 Eat
free_zone   8.50  10.87
start   9.00
end  12.00
```