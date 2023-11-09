// TODO get rid of Util class, make everything a top level exported function
export default class Util {
  /**
   * Converts seconds into a route to a human readable, zero-prefixed
   * time string.
   *
   * ex: secondsToTime(34200, 0) -> "09:30:00"
   *
   * @param keyTime RouteSheet keytime
   * @param secondsIntoRoute Offset from keytime into route
   */
  static secondsToTime(keyTime:number, secondsIntoRoute:number):string {
    function zeroPrefix(value:number) {
      return `${value < 10 ? '0' : ''}${value}`
    }
    // TODO this is a hack, fix
    if (!isNaN(secondsIntoRoute)) {
      const time = new Date(0)
      time.setUTCSeconds(keyTime + secondsIntoRoute)
      const hours = zeroPrefix(time.getUTCHours())
      const minutes = zeroPrefix(time.getUTCMinutes())
      const seconds = zeroPrefix(time.getUTCSeconds())
      return `${hours}:${minutes}:${seconds}`
    }
    else {
      return ""
    }
  }

  /**
   * Converts a keytime to human readable, zero prefixed time string without
   * seconds, ex: keyTimeNoSeconds(34200) -> "9:30"
   * @param keyTime RouteSheet keytime in seconds
   * @param prefixHourWithZero true if you want the result prefixed with hour
   */
  static keyTimeNoSeconds(keyTime:number, prefixHourWithZero:boolean = false) {
    var time = new Date(0);
    time.setUTCSeconds(keyTime);
    var hours;
    if (prefixHourWithZero) {
      hours = ('0' + time.getUTCHours()).slice(-2);
    }
    else {
      hours = time.getUTCHours();
    }

    var minutes = ('0' + time.getUTCMinutes()).slice(-2);
    return hours + ':' + minutes;
  }

  static distance2String(distanceInTenths) {
    distanceInTenths /= 10;
    return distanceInTenths.toFixed(2);
  }

  static strNaN(value, fixedLength = 2) {
    return isNaN(value) ? "&nbsp;" : value.toFixed(fixedLength);
  }

  static textNaN(value) {
    return isNaN(value) ? '' : value.toFixed(2);
  }

  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  static decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  static round10(value, exp) {
    return Util.decimalAdjust('round', value, exp);
  };
  // Decimal floor
  static floor10(value, exp) {
    return Util.decimalAdjust('floor', value, exp);
  };
  // Decimal ceil
  static ceil10(value, exp) {
    return Util.decimalAdjust('ceil', value, exp);
  };


  static mergeSort(arr, trichotomy) {
      if (arr.length < 2)
          return arr;

      var middle = arr.length / 2;
      var left   = arr.slice(0, middle);
      var right  = arr.slice(middle, arr.length);

      return Util.merge(Util.mergeSort(left, trichotomy), Util.mergeSort(right, trichotomy), trichotomy);
  }

  private static merge(left:any[], right:any[], trichotomy) {
      var result:any[] = [];

      while (left.length && right.length) {
          if (trichotomy(left[0], right[0]) <= 0) {
              result.push(left.shift());
          } else {
              result.push(right.shift());
          }
      }

      while (left.length)
          result.push(left.shift());

      while (right.length)
          result.push(right.shift());

      return result;
  }
}

export class EventDispatcher {
  eventMap

  on(eventNames, listener) {
    var self = this;
    eventNames.split(' ').forEach(function(eventName) {
      self.eventMap = self.eventMap || {};
      var listeners = self.eventMap[eventName];
      if (!listeners) {
        self.eventMap[eventName] = [];
        listeners = self.eventMap[eventName];
      }

      listeners.push({callback: listener });
    });
  }

  off(eventNames, listener) {
    var self = this;
    eventNames.split(' ').forEach(function(eventName) {
      self.eventMap = self.eventMap || {};
      var listeners = self.eventMap[eventName];

      if (listeners) {
        self.eventMap[eventName] = listeners.filter(function(item) {
          return item.callback !== listener;
        })

        if (self.eventMap[eventName].length === 0) {
          delete self.eventMap[eventName];
        }
      }
    });
  }

  dispatch(event) {
    this.eventMap = this.eventMap || {};
    var listeners = this.eventMap[event.name] || [];
    listeners.forEach(function(listener) {
      listener.callback(event);
    });
  }

  static extend(object) {
    Object.keys(EventDispatcher.prototype).forEach(function(key) {
      object.prototype[key] = EventDispatcher.prototype[key];
    })
  }
}
