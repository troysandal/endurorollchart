/*
  Behaviors are added to input controls to support formatted input
  for notes, distances, times and speed.
  */

import Util from "../timekeeping/util";

export class StringBehavior {
  input
  callback

  constructor(input, callback) {
    this.input = input;
    this.callback = callback;
    input.on('focus', null, this, this.onFocus);
  }

  getValue(e): number|string {
    const value = "" + $(e.target).val()
    return value.trim();
  }

  isValidValue(value) {
    !!value
    return true;
  }

  onFocus(e) {
    var self = e.data;
    self.oldValueString = $(e.target).val();
    self.oldValue = self.getValue(e);
    self.input.on('blur', null, self, self.onBlur);
    self.input.on('change', null, self, self.onChange);
  };

  onBlur(e) {
    var self = e.data;
    self.onChange(e);
    self.input.off('blur', self.onBlur);
    self.input.off('change', self.onChange);
  };

  onChange(e) {
    var self = e.data;
    var newValue = self.getValue(e);

    if (!self.isValidValue(newValue)) {
      $(e.target).val(self.oldValueString);
      console.log(e.type + ':bad input value ' + newValue + ' restoring to old ' + self.oldValueString);
    }
    else if (self.oldValue === newValue) {
      console.log(e.type + ':same values');
      $(e.target).val(self.oldValueString);
    }
    else {
      console.log(e.type + ':value changed from ' + self.oldValue + ' to ' + newValue);
      self.callback(self.oldValue, newValue);
      self.oldValueString = $(e.target).val();
      self.oldValue = self.getValue(e);
    }
  }
}


export class SpeedBehavior extends StringBehavior {
  _min = 1
  _max = Number.POSITIVE_INFINITY

  private between = (v) => {
    return v >= this._min && v <= this._max;
  }

  constructor(input, callback) {
    super(input, callback)
  }
  
  public set min(v : number) {
    this._min = Math.max(0, v);
  }
  
  public set max(v : number) {
    this._max = Math.max(this._min, v);
  }

  getValue(e) {
    const value = "" + $(e.target).val()
    return parseInt(value.trim(), 10);
  }

  isValidValue(value) {
    return (typeof value === 'number') && 
      !isNaN(value) &&
      this.between(value);
  }
}


export class DistanceBehavior extends StringBehavior {
  constructor(input, callback) {
    super(input, callback)
  }

  getValue(e) {
    const value = "" + $(e.target).val()
    var distance = parseFloat(value.trim());
    return Util.round10(distance, -2);
  }
  isValidValue(value) {
    return (typeof value == 'number') && !isNaN(value);
  }
}


export class MinutesBehavior extends StringBehavior {
  constructor(input, callback) {
    super(input, callback)
  }

  getValue(e) {
    const value = "" + $(e.target).val()
    return parseInt(value.trim(), 10);
  }
  isValidValue(value) {
    return (typeof value == 'number') && !isNaN(value);
  }
}

/**
 * Input behavior for parsing key times which are hh:mm formatted
 * 24 hour times, .e.g 08:30.
 */
export class KeyTimeBehavior extends StringBehavior {
  constructor(input, callback) {
    super(input, callback)
  }

  getValue(e) {
    const value = "" + $(e.target).val()
    const text = value.trim();
    const keyTime = text.split(':');

    const hour = Math.abs(parseInt(keyTime[0], 10)) % 24;
    const minute = Math.abs(parseInt(keyTime[1], 10)) % 60;

    return ((hour * 60) + minute) * 60;
  }

  isValidValue(value) {
    return (typeof value == 'number') && !isNaN(value);
  }
}
