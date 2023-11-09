import {ActionType} from '../../src/timekeeping/actions'
import {fromRS, toRS, jsonFromFullRS} from '../../src/timekeeping/serializeRS';
import {fromJSON} from '../../src/timekeeping/serializeJSON';
import Enduro from '../../src/timekeeping/enduro'
import Util from '../../src/timekeeping/util';
const round10 = Util.round10;
import * as fs from 'fs';
import { expect } from 'chai';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('RS file serializer', function() {
  describe('matches padding and alignment',() => {
    const inRSFile = `# Enduro Route Sheet
     title Green Marble 2003
   keytime   8:00
     speed   0.00  18
     speed  23.10  30
     reset  23.69  24.05
     reset  26.47  31.60
     speed  31.60  18
     speed  50.80  24
     speed  58.40  18
     reset  59.46  63.56
     reset  68.16  69.66
     reset  76.12  78.19
     reset  84.68  87.08
     reset  87.79  88.09
     reset  89.02  89.27
     speed  90.20  24
     reset  94.60  98.90
       end 106.20
`
    const enduro:Enduro = fromRS(inRSFile)
    const outRSFile = toRS(enduro)
    expect(outRSFile).to.equal(inRSFile)
  })

  describe('for RS files', function() {
    it('should read and write all actions', function() {
      const inRSFile = `# Enduro Route Sheet
     title First Title Line
    title2 Second Title Line
    title3 And finally the third title line
   keytime  19:41
     speed   0.00  30
     reset   3.31  3.96
 free_time   4.00  5
      note   4.30  sadf
   reset_0   9.00
  gas_stop   3.00
     known   7.00
 free_zone   8.50  10.87
     start   9.00
       end  12.00
`
      const enduro:Enduro = fromRS(inRSFile);
      const outRSFile = toRS(enduro);

      const inActions = inRSFile.split('\n');
      const outActions = outRSFile.split('\n');
      expect(inActions.length, "action counts").to.equal(outActions.length);
      inActions.forEach(function(_action, index) {
        expect(inActions[index].trim()).to.equal(outActions[index].trim());
      });
    })
  });

  describe('for actual races', function() {
    // TODO - can't we just load all *.txt recursively?
    // TODO - generate test names from routesheets
    const routeSheets:string[] = [
      // samples that came with Enduro Roll Chart
      'samples/BigBoot_97_Route_Sheet.txt',
      'samples/03gmer_Route_Sheet.txt',
      'samples/Buckhorn_99_Route_Sheet.txt',
      'samples/Cowbell_99_Route_Sheet.txt',
      'samples/Jackhammer_99_Route_Sheet.txt',
      'samples/03foggy_Route_Sheet.txt',
      'samples/Polecat_99_Route_Sheet.txt',
      'samples/Sawmill_99_Route_Sheet.txt',
      'samples/DeepCreek03_Route_Sheet.txt',
      'samples/Foggy_Mountain_02_Route_Sheet.txt',
      'samples/Broad Mountain 2002 A_Route_Sheet.txt',
      'samples/Sandy_Lane_2K2_Route_Sheet.txt',
      'samples/Sawmill_93_Route_Sheet.txt',
      'samples/PHILL2004_Route_Sheet.txt',
      'samples/WFO_95_Route_Sheet.txt',
      'samples/FoolsGold_99_Route_Sheet.txt',
      'samples/Quicksilver_98_Route_Sheet.txt',
      'samples/Quicksilver_99_Route_Sheet.txt',
      'samples/UEA_O3_Route_Sheet.txt',
      'samples/WFO_97_Route_Sheet.txt',
      'samples/WFO_98_Route_Sheet.txt',

      // Test files
      'test_allactiontypes_Route_Sheet.txt',
      'test.break.txt',
      'test.freezone_Route_Sheet.txt',
      'test.start_Route_Sheet.txt',
      'test.known_Route_Sheet.txt',
      'test.endcarry_Route_Sheet.txt',
      'test.reset_to_0_Route_Sheet.txt',

      // Route Sheets from oscar.wahlberg@gmail.com
      'oscar/49ers 2009_Route_Sheet.txt',
      'oscar/49ers Family Enduro 2008_Route_Sheet.txt',
      'oscar/Cowbell 2009_Route_Sheet.txt',
      'oscar/Cowbell 2015_Route_Sheet.txt',
      'oscar/Fool\'s Gold 2007_Route_Sheet.txt',
      'oscar/Fools Gold 2008_Route_Sheet.txt',
      'oscar/Fools Gold 2011_Route_Sheet.txt',
      'oscar/Fools Gold 2012_Route_Sheet.txt',
      'oscar/Jackhammer 2009_Route_Sheet.txt',
      'oscar/Jackhammer 2015_Route_Sheet.txt',
      'oscar/Jackhammer2016_Route_Sheet.txt',
      'oscar/Little Polecat 2008_Route_Sheet.txt',
      'oscar/Not-So-Tuff-E-Nuff 2012_Route_Sheet.txt',
      'oscar/WFO 2007_Route_Sheet.txt',
      'oscar/WFO 2009_Route_Sheet.txt',
      'oscar/WFO 2011_Route_Sheet.txt',
      'oscar/Wild Boar 2007_Route_Sheet.txt',
      'oscar/Wild Boar 2008_Route_Sheet.txt',
      'oscar/Wild Horse 2009_Route_Sheet.txt',
      'oscar/Wild Piglet 2007_Route_Sheet.txt',
      'oscar/Wild Piglet 2012_Route_Sheet.txt',

      // Terra Conlon terraconlon@gmail.com
      'terra/2011 Buckhorn_Route_Sheet.txt',
      'terra/2011 Crosscut_Route_Sheet.txt',
      'terra/2011 Jackhammer_Route_Sheet.txt',
      'terra/2011 Jackhammer_V2_Route_Sheet.txt',
      'terra/2011 Wild Horse v1_Route_Sheet.txt',
      'terra/2015 Cowbell Enduro V2_Route_Sheet.txt',
      'terra/2015 Crazy Miner_Route_Sheet.txt',
      'terra/2015 Crazy Miner_1_Route_Sheet.txt',
      'terra/2015 Jackhammer v2_Route_Sheet.txt',
      'terra/2015 Jackhammer v2_1_Route_Sheet.txt',
      'terra/2016 Crosscut_Route_Sheet.txt',
      'terra/2016 Fools Gold Enduro_Route_Sheet.txt',
      'terra/2016 Wild Piglet Family Enduro_Route_Sheet.txt',
      'terra/49ers 2012_Route_Sheet.txt',
      'terra/Buckhorn 2011_Route_Sheet.txt',

      // Alex akwagner@me.com
      'alex/2008 WFO_Route_Sheet.txt',
      'alex/2009 49er Family_Route_Sheet.txt',
      'alex/2009 Bearfoot_Route_Sheet.txt',
      'alex/2009 Fools Gold_Route_Sheet.txt',
      'alex/2009 Jackhammer_Route_Sheet.txt',
      'alex/2009 WFO_Route_Sheet.txt',
      'alex/2010 Crosscut_Route_Sheet.txt',
      'alex/2010Cowbell_Route_Sheet.txt',
      'alex/2011 49er Family_Route_Sheet.txt',
      'alex/2011 Bearfoot_Route_Sheet.txt',
      'alex/2011 Fools Gold_Route_Sheet.txt',
      'alex/2011 WFO_Route_Sheet.txt',
      'alex/2012 49r Enduro_Route_Sheet.txt',
      'alex/2012 49r Family Enduro_Route_Sheet.txt',
      'alex/2012 Crazy Miner Enduro_Route_Sheet.txt',
      'alex/2012 Fools Gold_Route_Sheet.txt',
      'alex/2013 49er Family_Route_Sheet.txt',
      'alex/2013 Bearfoot_Route_Sheet.txt',
      'alex/2013 Cowbell_Route_Sheet.txt',
      'alex/2013 Crazy Miner_Route_Sheet.txt',
      'alex/2013 Fools Gold_Route_Sheet.txt',
      'alex/2013 WFO_Route_Sheet.txt',
      'alex/2014 49er Enduro_Route_Sheet.txt',
      'alex/2014 49er Family_Route_Sheet.txt',
      'alex/2014 Cowbell Enduro_Route_Sheet.txt',
      'alex/2014 Crazy Miner_Route_Sheet.txt',
      'alex/2014 Jackhammer_Route_Sheet.txt',
      'alex/2014 WildPony_Route_Sheet.txt',
      'alex/2014FoolsGold_Route_Sheet.txt',
      'alex/2015 49er Enduro_Route_Sheet.txt',
      'alex/2015 49er Family_Route_Sheet.txt',
      'alex/2015 Bearfoot_Route_Sheet.txt',
      'alex/2015 Cowbell_Route_Sheet.txt',
      'alex/2015 Fools Gold Enduro_Route_Sheet.txt',
      'alex/2015 Jackhammer_Route_Sheet.txt',
      'alex/2016 Fools Gold_Route_Sheet.txt',
      'alex/Cowbell 2009_Route_Sheet.txt',
      'alex/Polecat 2008_Route_Sheet.txt',
      'alex/Sawmill 2009_Route_Sheet.txt'
    ];

    // Our calculations are slightly different and in fact better than
    // Enduro Computer 3.1 - this wiggle room map allows for that as seconds
    // comparisons are often times off a bit.
    const wiggleMap = {
      [ActionType.SpeedChange]: { endTimeInSeconds: 1 },
      [ActionType.End]:         { startTimeInSeconds: 1, endTimeInSeconds: 1 },
      [ActionType.Note]:        { startTimeInSeconds: 1, endTimeInSeconds: 1 },
      [ActionType.Reset]:       { startTimeInSeconds: 1, endTimeInSeconds: 1 },
      [ActionType.FreeTime]:    { startTimeInSeconds: 1, endTimeInSeconds: 1 },
      [ActionType.FreeZone]:    { startTimeInSeconds: 1, endTimeInSeconds: 1 }
    };

    routeSheets.forEach(function(path) {
      it(path, function(done) {
        const p = `${__dirname}/../routesheets/${path}`;
        fs.readFile(p, 'utf8', function(err, data) {
          if (err) { throw err; }
          // var fileName = path.match(/.+\/(.+)$/)[1];
          var actual;
          if (path.match(/\.txt$/)) {
            actual = jsonFromFullRS(data);
          }
          else if (path.match(/\.json$/)) {
            var json = JSON.parse(data);
            actual = fromJSON(json);
          }

          if (actual.routeSheet && actual.routeSheet.actions.length) {
            const enduro:Enduro = fromJSON(actual);
            const routeSheet = enduro.routeSheet;

            const errors = routeSheet.actions().filter((action) => !!action.error)
            expect(errors.length, 'error count').to.equal(0);

            expect(enduro.title, 'title').to.equal(actual.title, `Title MisMatch`);
            expect(routeSheet.getKeyTime(), 'key time').to.equal(actual.routeSheet.keyTime, 'keytime mismatch');
            expect(routeSheet.actions().length, 'action length').to.equal(actual.routeSheet.actions.length,`actions.length mismatch`);

            routeSheet.actions().forEach(function(rsAction, index) {
              var expected = actual.routeSheet.actions[index];
              var typeName = rsAction.type
              var wiggle = wiggleMap[typeName];
              var wiggleRoom = 0;

              var prefix = 'action[' + index + '](' + typeName + "@" + expected.distance + ")";
              expect(typeName, prefix + ':type').to.equal(expected.type, `typename mismatch`);
              expect(rsAction.startDistanceInTenths, prefix + ':startDistanceInTenths').to.equal(round10(expected.distance * 10, -1), `start distance mismatch`);
              expect(rsAction.endDistanceInTenths, prefix + ':endDistance').to.equal(round10(expected.endDistance, -1), `end distance mismatch`);
              if (wiggle) {
                wiggleRoom = wiggle.startTimeInSeconds || 0;
              }
              else {
                wiggleRoom = 0;
              }
              expect(rsAction.startTimeInSeconds, prefix + ':startTimeInSeconds').to.be.within(expected.startTimeInSeconds - wiggleRoom, expected.startTimeInSeconds + wiggleRoom, `start time mismatch`);

              if (wiggle) {
                wiggleRoom = wiggle.endTimeInSeconds || 0;
              }
              else {
                wiggleRoom = 0;
              }
              expect(rsAction.endTimeInSeconds, prefix + ':endTimeInSeconds').to.be.within(expected.endTimeInSeconds - wiggleRoom, expected.endTimeInSeconds + wiggleRoom, `end time mismatch`);
            });
          }
          done();
        });
      });
    });
  });
});
