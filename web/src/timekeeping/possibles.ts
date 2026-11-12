/**
 @module
 Used to compute the minimum possible for any given speed.  In time keeper
 enduros all checkpoints, speed changes and Resets to 0 must be on even 10th
 of mile/km and a whole minute. This includes secret checkpoints.  Given this
 rule and the last speed change you can compute all the possible locations
 for any upcoming checkpoints.

 For example, if the current speed of a route is 9mph then there is a possible
 every 0.3 mi.  If you're riding exactly 9mph then it will take you 2 minutes
 to travel that 0.3mi. Another way to say it is the rider is travelling
 0.3 mi every 2 minutes.  Knowing that distance to the next possible enables
 a strategy of "riding the possibles".  JART charts show the possibles between
 Speed Changes for just this reason.

 This [spreadhseet](https://docs.google.com/spreadsheets/d/1X17yhW1pIJXoo3918EXN8I7J3dWXZyik1LQU6QMmJg8)
 illustrates how to find the minimum possible for a given speed.
 */

/**
 Defines the minimum 1/10th and minute for a given speed.
 */
export class MinimumPossible {
  readonly speed:number
  readonly distance:number
  readonly minutes:number

  constructor(speed:number,  distance:number,  minutes:number) {
    this.speed = speed
    this.distance = distance
    this.minutes = minutes
  }
}

// Cache of minimum possibles, indexed by speed.
const CACHE:MinimumPossible[] = [];

/**
  Generates the minimum possible for any given speed by finding the minimum
  T (Time in minutes) that satisfies:
  ```
  Distance Formula : (D * 60) / T = S
  Check on 1/10th  : (D * 100) % 10 === 0
  ```
  Where:
    ```
  S === Speed in MPH
  D === Distance travelled every T
  T === Time Interval in Minutes
  ```

  Rather than enumerating all values of T we cheat knowing that every
  T will be one of `[1, 2, 3, 6]`.

  First we solve for D given T and S:
  ```
  (D * 60) / T = S
  D * 60 = S * T
  D = (S * T) / 60
  ```
  Next we set `D' = D * 100` to avoid using Math.round() which introduced
  browser specific issues due to implementation differences.
  ```
  Distance Formula : D' = (100 * S * T) / 60
  Check on 1/10th  : D' % 10 == 0
  ```
*/
function computeMinimum(forSpeed:number):MinimumPossible {
  let result = new MinimumPossible(forSpeed, 0, 0)
  const S = forSpeed;
  const Ts = [1, 2, 3, 6];

  for (const T of Ts) {
    const D = (100 * S * T) / 60;
    const checkForTenth = D % 10;
    if (checkForTenth === 0) {
      result = new MinimumPossible(forSpeed, D / 100, T);
      break
    }
  }

  return result
}


/**
  Returns the minimum possible for a given speed.
  @param speed
 */
export function getMinimum(speed:number):MinimumPossible {
  if (!CACHE[speed]) {
    CACHE[speed] = computeMinimum(speed);
  }
  return CACHE[speed];
}
