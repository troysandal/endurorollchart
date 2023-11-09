import {fromRS} from '../../src/timekeeping/serializeRS';
import RouteSheet from '../../src/timekeeping/routesheet';
import {SpeedChange, ActionType} from '../../src/timekeeping/actions'
import JART from '../../src/timekeeping/jart';
import { expect } from 'chai';
import Enduro from '../../src/timekeeping/enduro';

describe('JART chart', function() {
  describe('from empty routesheet', function() {
    it('should return an almost empty JART', function() {
      const enduro = new Enduro(new RouteSheet(18))
      const jart = new JART();
      jart.createFromEnduro(enduro);
      expect(jart).to.not.be.null;
      expect(jart.rows.length).to.equal(2);
      expect(jart.rows[0].type).to.equal('title');
      expect(jart.rows[1].type).to.equal(ActionType.SpeedChange);
    });

    it('should show first possibles at 3.0', function() {
      const enduro = new Enduro(new RouteSheet(18))
      enduro.routeSheet.appendAction(new SpeedChange(3.3, 18))
      const jart = new JART();
      jart.createFromEnduro(enduro);
      expect(jart).to.not.be.null;
      expect(jart.rows[0].type).to.equal('title');
      expect(jart.rows[1].type).to.equal(ActionType.SpeedChange);
      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].startDistance).to.equal(30);
    });

    it('should not show possible alongside speed changes', function() {
      const enduro = new Enduro(new RouteSheet(18))
      enduro.routeSheet.appendAction(new SpeedChange(3.3, 18))
      const jart = new JART();
      jart.createFromEnduro(enduro);
      expect(jart).to.not.be.null;
      expect(jart.rows[0].type).to.equal('title');
      expect(jart.rows[1].type).to.equal(ActionType.SpeedChange);
      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.SpeedChange);
      expect(jart.rows[3].startDistance).to.equal(33);
    });

    it('free times should bump next possible', function() {
      const rsData = "\
      keytime 8:00     \n \
        speed 0.00  15 \n \
    free_zone 3.3  8   \n \
    free_time 5 4      \n \
        speed 6.5  15  \n \
        speed 8.5  18  \n \
";
      const enduro:Enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);
      expect(jart.rows[6].type).to.equal('possible');
      expect(jart.rows[6].minute).to.equal(36);
    });
  });

  describe('start minute', function() {
      it("should be key time minute", function() {
        const rsData = "keytime 8:15\n speed 0.00  15";
        const enduro:Enduro = fromRS(rsData);
        const jart = new JART();
        jart.createFromEnduro(enduro);
        expect(jart.rows[1].minute).to.equal(15);
      });
  });

  describe('possibles', function() {
      it("should be on whole 1/10th and minute", function() {
        const rsData = "\
          speed 0.00  18 \n \
          speed 3.30  18";
        const enduro = fromRS(rsData);
        const jart = new JART();
        jart.createFromEnduro(enduro);
        expect(jart.rows[2].type).to.equal('possible');
        expect(jart.rows[2].minute).to.equal(10);
        expect(jart.rows[2].startDistance).to.equal(30);
      });

      it("shouldn't appear at next speed change", function() {
        const rsData = "\
          speed 0.00  18 \n \
          speed 3.30  18 \n \
          note 3.31 hi mom";
        const enduro = fromRS(rsData);
        const jart = new JART();
        jart.createFromEnduro(enduro);
        expect(jart.rows[3].type).to.equal(ActionType.SpeedChange);
        expect(jart.rows[3].minute).to.equal(11);
        expect(jart.rows[3].startDistance).to.equal(33);
      });

      it("shouldn't appear at minimum secret speed", function() {
        const MINIMUM_SPEED = 5;
        const rsData = `
          keytime   8:00
            speed   0.00  18
            speed   3.60  ${MINIMUM_SPEED}
              note  4.00  note
        `;
        const enduro = fromRS(rsData);
        enduro.routeSheet.options.useSecretMinSpeed = true;
        enduro.routeSheet.options.secretMinSpeed = MINIMUM_SPEED;
        const jart = new JART();
        jart.createFromEnduro(enduro);
        const count = jart.rows.filter((row) => {
          return row.type === 'possible' && row.speed <= MINIMUM_SPEED;}
        ).length;
        expect(count).to.equal(0);
      })

      it("shouldn't appear at less than minimum secret speed", function() {
        const MINIMUM_SPEED = 6;
        const rsData = `
          keytime   8:00
            speed   0.00  18
            speed   3.60  3
              note  4.00  note
        `;
        const enduro = fromRS(rsData);
        enduro.routeSheet.options.useSecretMinSpeed = true;
        enduro.routeSheet.options.secretMinSpeed = MINIMUM_SPEED;
        const jart = new JART();
        jart.createFromEnduro(enduro);
        const count = jart.rows.filter((row) => {
          return row.type === 'possible' && row.speed <= MINIMUM_SPEED;}
        ).length;
        expect(count).to.equal(0);
      })
  });

  describe('speed changes', function() {
      it("can appear inside resets", function() {
        const rsData = "\
          speed 0.00  18 \n \
          reset 3.29 4.6 \n \
          speed 3.6 18 \n \
          speed 5.1 18";
        const enduro = fromRS(rsData);
        const jart = new JART();
        jart.createFromEnduro(enduro);
        expect(jart.rows[3].type).to.equal(ActionType.Reset);
        expect(jart.rows[4].type).to.equal(ActionType.SpeedChange);
        expect(jart.rows[5].type).to.equal('possible');
      });
  });

  describe('knowns', function() {
    it("should get 3 in and 3 out", function() {
      const rsData = "\
        speed 0.00  18 \n \
        known 6.00 \n \
        speed 9.30 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.Known);
      expect(jart.rows[3].minute).to.equal(20);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(30);
      expect(jart.rows[4].startDistance).to.equal(90);
      expect(jart.rows[5].type).to.equal(ActionType.SpeedChange);
      expect(jart.rows[5].minute).to.equal(31);
      expect(jart.rows[5].startDistance).to.equal(93);
    });
  });

  describe('start', function() {
    it("should get 3 out", function() {
      const rsData = "\
        speed 0.00  18 \n \
        start 3.00     \n \
        speed 6.30 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.Start);
      expect(jart.rows[3].minute).to.equal(10);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(20);
      expect(jart.rows[4].startDistance).to.equal(60);
    });
  });

  describe('free time', function() {
    it("should move clock forward", function() {
      const rsData = "\
            speed 0.00  18 \n \
        free_time 3.00  4  \n \
            speed 3.30 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.FreeTime);
      expect(jart.rows[3].minute).to.equal(10);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(14);
      expect(jart.rows[4].startDistance).to.equal(30);
    });
  });

  describe('free zone', function() {
    it("should contain no possibles", function() {
      const rsData = "\
            speed 0.00 18   \n \
        free_zone 3.00 4.00 \n \
            speed 4.50 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.FreeZone);
      expect(jart.rows[3].minute).to.equal(10);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(14);
      expect(jart.rows[4].startDistance).to.equal(42);
    });
  });

  describe('resets', function() {
    it("should contain no possibles", function() {
      const rsData = "\
            speed 0.00 18   \n \
        free_zone 3.00 4.00 \n \
            speed 4.50 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.FreeZone);
      expect(jart.rows[3].minute).to.equal(10);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(14);
      expect(jart.rows[4].startDistance).to.equal(42);
    });
  });

  describe('reset to 0', function() {
    it("should start a new lap at 0", function() {
      const rsData = "\
          speed 0.00  18 \n \
        reset_0 3.00 \n \
          speed 0.60 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.ResetToZero);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(11);
      expect(jart.rows[4].startDistance).to.equal(3);
    });
  });

  describe('gas stop', function() {
    it("should get 2 in and 3 out", function() {
      const rsData = "\
        speed 0.00  18 \n \
        gas_stop 5.00 \n \
        speed 8.40 18 ";
      const enduro = fromRS(rsData);
      const jart = new JART();
      jart.createFromEnduro(enduro);

      expect(jart.rows[2].type).to.equal('possible');
      expect(jart.rows[2].minute).to.equal(10);
      expect(jart.rows[2].startDistance).to.equal(30);
      expect(jart.rows[3].type).to.equal(ActionType.GasStop);
      expect(jart.rows[4].type).to.equal('possible');
      expect(jart.rows[4].minute).to.equal(27);
      expect(jart.rows[4].startDistance).to.equal(81);
    });
  });

  var ROUTE_SHEETS = [
    {
      name: "Minutes Mod 60",
      rowCount: 61,
      expected: [
        {
          index: 59, type: 'possible',
          values: { minute:0, startDistance: 600 }
        }
      ],
      rs: " \
        title Minutes Mod 60 \n \
        speed 0 60 \n \
        speed 61 60 \n"

    },
    {
      name: "Start 3 Free",
      rowCount: 4,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 2, type: 'possible',
          values: { minute:10, speed: 18, startDistance: 30 }
        },
        {
          index: 3, type: ActionType.SpeedChange,
          values: { minute:11, speed: 24, startDistance: 33 }
        }
      ],
      rs: " \
        title Start 3 for Free \n \
        speed 0 18 \n \
        speed 3.3 24 \n"

    },
    {
      name: "Known +/- 3 Buffer",
      rowCount: 6,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 2, type: 'possible',
          values: { minute:10, speed: 18, startDistance: 30 }
        },
        {
          index: 3, type: 'known',
          values: { minute:20, speed: 18, startDistance: 60 }
        },
        {
          index: 4, type: 'possible',
          values: { minute:30, speed: 18, startDistance: 90 }
        },
        {
          index: 5, type: ActionType.SpeedChange,
          values: { minute:31, speed: 18, startDistance: 93 }
        }
      ],
      rs: " \
      title known 3 for free \n \
      speed 0 18 \n \
      known 6 18 \n \
      speed 9.3 18 \n "
    },

    {
      name: "Free Zone",
      rowCount: 6,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 2, type: 'possible',
          values: { minute:10, speed: 18, startDistance: 30 }
        },
        {
          index: 3, type: 'freeZone',
          values: { speed: 18, startDistance: 31.2 }
        },
        {
          index: 4, type: 'possible',
          values: { minute:15, speed: 18, startDistance: 45 }
        },
        {
          index: 5, type: ActionType.SpeedChange,
          values: { minute:16, speed: 24, startDistance: 48 }
        }
      ],
      rs: " \
        title free zone \n \
        speed 0 18 \n \
        free_zone 3.12 4.21 \n \
        speed 4.8 24 \n "
    },

    {
      name: "Gas Stop",
      rowCount: 5,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 2, type: 'gasStop',
          values: { minute: 10, speed: 18, startDistance: 31.2 }
        },
        {
          index: 3, type: 'possible',
          values: { minute:21, speed: 18, startDistance: 63 }
        },
        {
          index: 4, type: ActionType.SpeedChange,
          values: { minute:22, speed: 24, startDistance: 66 }
        }
      ],
      rs: " \
        title gas stop \n \
        speed 0 18 \n \
        gas_stop 3.12 \n \
        speed 6.6 24 \n"
    },

    {
      name: "Free Time",
      rowCount: 6,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 3, type: 'freeTime',
          values: { minute: 10, speed: 18, startDistance: 31.2 }
        },
        {
          index: 4, type: 'possible',
          values: { minute:15, speed: 18, startDistance: 33 }
        },
        {
          index: 5, type: ActionType.SpeedChange,
          values: { minute:16, speed: 24, startDistance: 36 }
        }
      ],
      rs: " \
        title free time \n \
        speed 0 18 \n \
        free_time 3.12 4 \n \
        speed 3.6 24 \n"
    },

    {
      name: "Reset to 0",
      rowCount: 7,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 18, startDistance: 0 }
        },
        {
          index: 4, type: ActionType.ResetToZero,
          values: { minute: 11, speed: 18, startDistance: 33 }
        },
        {
          index: 5, type: 'possible',
          values: { minute:12, speed: 18, startDistance: 3 }
        },
        {
          index: 6, type: ActionType.SpeedChange,
          values: { minute:13, speed: 24, startDistance: 6 }
        }
      ],
      rs: " \
        title reset to 0 \n \
        speed 0 18 \n \
        reset_0 3.3 \n \
        speed 0.6 24 \n "
    },

    {
      name : 'Foggy Mountain',
      rowCount: 226,
      expected: [
        {
          index: 1, type: ActionType.SpeedChange,
          values: { minute:0, speed: 24, startDistance: 0 }
        },
        {
          index: 114, type: ActionType.ResetToZero,
          values: { minute:11, speed: 18, startDistance: 562 }
        },
      ],

      rs: "title Foggy Mountain \n \
         title2 2003 \n \
         speed   0.00  24 \n \
         reset   0.60   3.20 \n \
         speed   5.20  18 \n \
         speed   8.80  24 \n \
         speed  15.20  18 \n \
         reset  15.85  20.30 \n \
         speed  21.20  24 \n \
         speed  24.40  18 \n \
         reset  24.70  28.60 \n \
         speed  30.70  24 \n \
         reset  34.70  38.70 \n \
         speed  38.70  18 \n \
         reset  41.10  45.60 \n \
         speed  49.80  30 \n \
         speed  55.30  18 \n \
     free_time  56.20  30 \n \
       reset_0  56.20 \n \
         speed   0.00  24 \n \
         speed   4.00  18 \n \
         reset   5.05   8.05 \n \
         speed   7.90  24 \n \
         speed  13.10  18 \n \
         reset  14.00  18.50 \n \
         speed  20.30  24 \n \
         speed  27.90  18 \n \
         reset  28.20  32.70 \n \
         reset  34.00  37.00 \n \
         speed  38.70  24 \n \
         reset  46.30  54.30 \n \
         speed  55.10  30 \n \
         speed  60.60  18 \n \
           end  61.50 \n"

   }];

  describe('actual JARTs', function() {
    ROUTE_SHEETS.forEach(function(RS) {
      it(RS.name, function() {
        const enduro = fromRS(RS.rs);
        const jart = new JART();
        jart.createFromEnduro(enduro);

        expect(RS.rowCount, '# rows').to.equal(jart.rows.length);

        RS.expected.forEach((expected:any) => {
          const row = jart.rows[expected.index];
          const rowTypeName = row.type

          expect(rowTypeName, 'type/' + expected.index).to.equal(expected.type);
          Object.keys(expected.values).forEach(function(key) {
            expect(row[key], key + '/' + expected.index).to.equal(expected.values[key]);
          });
        })
      });
    });

  });
});
