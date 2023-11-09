import {MinimumPossible, getMinimum} from '../../src/timekeeping/possibles';
import { expect } from 'chai';

describe('possibles', function() {
  const ExpectedMinimums:any[] = [];
  ExpectedMinimums[1] =  { distance:0.1, minutes:6 };
  ExpectedMinimums[2] =  { distance:0.1, minutes:3 };
  ExpectedMinimums[3] =  { distance:0.1, minutes:2 };
  ExpectedMinimums[4] =  { distance:0.2, minutes:3 };
  ExpectedMinimums[5] =  { distance:0.5, minutes:6 };
  ExpectedMinimums[6] =  { distance:0.1, minutes:1 };
  ExpectedMinimums[7] =  { distance:0.7, minutes:6 };
  ExpectedMinimums[8] =  { distance:0.4, minutes:3 };
  ExpectedMinimums[9] =  { distance:0.3, minutes:2 };
  ExpectedMinimums[10] = { distance:0.5, minutes:3 };
  ExpectedMinimums[11] = { distance:1.1, minutes:6 };
  ExpectedMinimums[12] = { distance:0.2, minutes:1 };
  ExpectedMinimums[13] = { distance:1.3, minutes:6 };
  ExpectedMinimums[14] = { distance:0.7, minutes:3 };
  ExpectedMinimums[15] = { distance:0.5, minutes:2 };
  ExpectedMinimums[16] = { distance:0.8, minutes:3 };
  ExpectedMinimums[17] = { distance:1.7, minutes:6 };
  ExpectedMinimums[18] = { distance:0.3, minutes:1 };
  ExpectedMinimums[19] = { distance:1.9, minutes:6 };
  ExpectedMinimums[20] = { distance:1.0, minutes:3 };
  ExpectedMinimums[21] = { distance:0.7, minutes:2 };
  ExpectedMinimums[22] = { distance:1.1, minutes:3 };
  ExpectedMinimums[23] = { distance:2.3, minutes:6 };
  ExpectedMinimums[24] = { distance:0.4, minutes:1 };
  ExpectedMinimums[25] = { distance:2.5, minutes:6 };
  ExpectedMinimums[26] = { distance:1.3, minutes:3 };
  ExpectedMinimums[27] = { distance:0.9, minutes:2 };
  ExpectedMinimums[28] = { distance:1.4, minutes:3 };
  ExpectedMinimums[29] = { distance:2.9, minutes:6 };
  ExpectedMinimums[30] = { distance:0.5, minutes:1 };
  ExpectedMinimums[31] = { distance:3.1, minutes:6 };
  ExpectedMinimums[32] = { distance:1.6, minutes:3 };
  ExpectedMinimums[33] = { distance:1.1, minutes:2 };
  ExpectedMinimums[34] = { distance:1.7, minutes:3 };
  ExpectedMinimums[35] = { distance:3.5, minutes:6 };
  ExpectedMinimums[36] = { distance:0.6, minutes:1 };
  ExpectedMinimums[37] = { distance:3.7, minutes:6 };
  ExpectedMinimums[38] = { distance:1.9, minutes:3 };
  ExpectedMinimums[39] = { distance:1.3, minutes:2 };
  ExpectedMinimums[40] = { distance:2.0, minutes:3 };
  ExpectedMinimums[41] = { distance:4.1, minutes:6 };
  ExpectedMinimums[42] = { distance:0.7, minutes:1 };
  ExpectedMinimums[43] = { distance:4.3, minutes:6 };
  ExpectedMinimums[44] = { distance:2.2, minutes:3 };
  ExpectedMinimums[45] = { distance:1.5, minutes:2 };
  ExpectedMinimums[46] = { distance:2.3, minutes:3 };
  ExpectedMinimums[47] = { distance:4.7, minutes:6 };
  ExpectedMinimums[48] = { distance:0.8, minutes:1 };
  ExpectedMinimums[49] = { distance:4.9, minutes:6 };
  ExpectedMinimums[50] = { distance:2.5, minutes:3 };
  ExpectedMinimums[51] = { distance:1.7, minutes:2 };
  ExpectedMinimums[52] = { distance:2.6, minutes:3 };
  ExpectedMinimums[53] = { distance:5.3, minutes:6 };
  ExpectedMinimums[54] = { distance:0.9, minutes:1 };
  ExpectedMinimums[55] = { distance:5.5, minutes:6 };
  ExpectedMinimums[56] = { distance:2.8, minutes:3 };
  ExpectedMinimums[57] = { distance:1.9, minutes:2 };
  ExpectedMinimums[58] = { distance:2.9, minutes:3 };
  ExpectedMinimums[59] = { distance:5.9, minutes:6 };
  ExpectedMinimums[60] = { distance:1.0, minutes:1 };

  it('are always on minimum possibles', function() {
    ExpectedMinimums.forEach(function(expected, speed) {
      if (!expected) { return; }
      const actual:MinimumPossible = getMinimum(speed);
      expect(actual, 'Speed=' + speed).to.not.be.null;
      expect(actual.speed).to.equal(speed)
      expect(actual.distance, 'Speed=' + speed).to.equal(expected.distance);
      expect(actual.minutes, 'Speed=' + speed).to.equal(expected.minutes);
    });
  });
});
