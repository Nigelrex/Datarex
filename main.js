const fs = require("fs-extra");
const Database = require("better-sqlite3");
const _ = require("lodash");
const moment = require("moment");

module.exports = class DatabaseManager extends Map {
  /**
   * @param {boolean} options.path path to database
   * @param {string} options.tableName Your tablename
   * @param {Object} options.settings Settings
   * @param {boolean} options.settings.inMemory Set to true to use cache
   * @param {boolean} options.settings.clearCache Set to true to clear cache in intervals
   * @param {Object} options.Intervals Intervals
   * @param {boolean} options.Intervals.clearCacheInterval Set the interval to clear cache
   * @param {boolean} options.Intervals.expireInterval Set the interval to expire a key
   *
   */
  constructor(options = {}) {
    super();
    this.path = options.path ?? "./Databases/json.sqlite";
    this.tableName = options.tableName ?? "json";
    this.Intervals = options.Intervals ?? {
      expiryInterval: 1000,
      clearCacheInterval: 300000,
    };
    this.settings = options.settings ?? { clearCache: true, inMemory: true };
    this.settings.clearCache = this.settings.clearCache ?? true;
    this.settings.inMemory = this.settings.inMemory ?? true;
    fs.ensureDir(this.path.split(/\w+\.\w+/g.exec(this.path).pop())[0]);

    this.db = new Database(this.path);
    setInterval(async () => {
      try {
        this.all().forEach((element) => {
          if (element.VALUE.expiry <= moment().unix()) this.delete(element.KEY);
        });
      } catch (error) {}
    }, this.Intervals.expiryInterval);
    setInterval(() => {
      try {
        if (this.settings.inMemory) super.clear();
      } catch (error) {}
    }, this.Intervals.clearCacheInterval);
  }

  /**
   * @param {String} key
   * @param {Number} value
   */
  add(key, value) {
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, get + value);
  }

  /**
   * @returns All keys
   */
  all() {
    var stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE KEY IS NOT NULL`
    );
    let resp = [];
    for (var row of stmt.iterate()) {
      try {
        let VALUE = JSON.parse(row.VALUE);
        resp.push({
          KEY: row.KEY,
          VALUE,
        });
      } catch (error) {}
    }
    return resp;
  }
  /**
   *
   */
  async backup(options = {}) {
    if (!options.name)
      options.name ===
        `backup-${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`;

    fs.ensureDir(path.split(/\w+\.\w+/g.exec(path).pop())[0]);
    if (!options.path) options.path === "./";

    if (options.path.slice(-1) !== "/") options.path += "/";

    options.name = options.name.split(" ").join("-");

    if (
      options.name.includes(
        "/" || "\\" || "?" || "*" || '"' || ":" || "<" || ">"
      )
    )
      throw TypeError(`
        ${pico.red(
          `Backup database names cannot include there special characters: `
        )}/\\?*":<>`);

    const dbName = options.path + options.name;

    await this.db.backup(dbName);
  }
  /**
   * Clears the cache
   */
  clearCache() {
    super.clear();
  }
  /**
   * closes the database
   */
  close() {
    this.db.close();
  }
  /**
   *@param {String} key
   */
  delete(key) {
    if (typeof key === "number") key = key.toString();
    if (this.settings.inMemory) super.delete(key);
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE KEY = (?)`).run(key);
  }

  /**
   * @param {String} KEY
   * @param {any} value
   */
  deleteAll() {
    if (this.settings.inMemory) super.clear();
    this.db.prepare(`DELETE FROM ${this.tableName}`).run();
  }

  /**
   * @param {String} key
   * @param {Number} value
   * divides 2 numbers and set it
   */
  divide(key, value) {
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, get / value);
  }

  /**
   * @param {String} key
   * @returns {any}
   */
  get(key) {
    this._ctine();
    if (typeof key === "number") key = key.toString();
    if (this.settings.inMemory) return super.get(key);
    let target;
    let output;
    if (key && key.includes(".")) {
      let unparsed = key.split(".");
      key = unparsed.shift();
      target = unparsed.join(".");
    }
    let fetched = JSON.parse(
      this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE KEY = (?)`)
        .get(key).VALUE
    );

    if (typeof fetched === "object" && target) output = _.get(fetched, target);
    else output = fetched;
    return output ?? undefined;
  }

  /**
   * @param {String} key
   * @returns {Boolean}
   */
  has(key) {
    if (typeof key === "number") key = key.toString();
    return Boolean(
      this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE KEY = (?)`)
        .get(key)
    );
  }

  /**
   * @param {String} key
   * @param {Number} value
   * multiplies 2 numbers and set it
   */
  multiply(key, value) {
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, get * value);
  }

  /**
   * @param {String} KEY
   * @param {any} value
   */
  push(key, value) {
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (typeof get !== "object") throw Error(`${key} is not an array`);
    this.set(key, get.push(value));
  }
  /**
   * @param {String} key
   * @param {Function} value
   */
  removeArrVal(key, value) {
    const data = this.get(key);
    if (!_.isArray(data)) throw Error(`${key} is not an array`);
    const criteria = isFunction(value) ? value : (val) => value === val;
    const index = data.findIndex(criteria);
    if (index > -1) {
      data.splice(index, 1);
    }
    this.set(key, data);
  }
  /**
   * @param {String} key
   */
  removeObjVal(key) {
    let Fkey = key;
    let Gkey;
    if (key.includes(".")) {
      key = key.split(".");
      Gkey = key.shift();
      key = key.join(".");
    }
    const GET = this.get(Gkey);
    delete GET[key];
    this.set(Gkey, GET);
  }

  /**
   * @param {String} KEY
   * @param {any} value
   */
  set(key, value) {
    this._ctine();
    if (typeof key === "number") key = key.toString();
    if (this.settings.inMemory) super.set(key, value);
    let target;
    if (key && key.includes(".")) {
      let unparsed = key.split(".");
      key = unparsed.shift();
      target = unparsed.join(".");
    }
    let fetched = this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE KEY = (?)`)
      .get(key);

    if (!Boolean(fetched)) {
      this.db
        .prepare(`INSERT INTO ${this.tableName} (KEY , VALUE) VALUES( ? , ? )`)
        .run(key, "{}");
      fetched = this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE KEY = (?)`)
        .get(key);
    }
    fetched = JSON.parse(fetched.VALUE);

    if (typeof fetched === "object" && target)
      value = _.set(fetched, target, value);
    value = JSON.stringify(value);

    this.db
      .prepare(
        `UPDATE ${this.tableName} SET KEY = (?), VALUE = (?) WHERE KEY = (?)`
      )
      .run(key, value, key);
  }

  /**
   * @param {String} key
   * @param {String} value
   * @param {String} timeString
   */
  setExpiry(key, timeString) {
    let target;
    if (key && key.includes(".")) {
      let unparsed = key.split(".");
      key = unparsed.shift();
      target = unparsed.join(".");
    }
    const Nkey = key;
    key = this.get(key);
    const time = this._parseTime(timeString);
    key.expiry = time / 1000 + moment().unix();
    key.now = moment().unix();
    this.set(Nkey, key);
  }

  /**
   * @param {Object} array
   *
   */
  setMany(array) {
    if (!_.isArray(array)) throw Error(`${array} is not an array`);
    array.forEach((element, index) => {
      try {
        this.set(element.KEY, element.VALUE);
      } catch (error) {}
    });
  }

  /**
   * @param {string} key
   * @param {Number} value
   */
  subtract(key, value) {
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, get - value);
  }

  /**
   * @private
   */
  async _async(code) {
    return code;
  }

  /**
   * @private
   */
  _ctine() {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${this.tableName} (KEY TEXT, VALUE TEXT)`
      )
      .run();
  }

  /**
   * @private
   * @param {String} timeString
   */
  _parseTime(timeString) {
    const s = 1000;
    const m = s * 60;
    const h = m * 60;
    const d = h * 24;
    const w = d * 7;
    const mo = w * 4;
    const y = d * 365.25;
    let secs;
    let mins;
    let hrs;
    let days;
    let weeks;
    let Months;
    let years;
    if (/\d+s/g.test(timeString))
      secs = parseInt(/\d+s/g?.exec(timeString)[0]?.replace("s", "")) * s;
    else secs = 0;
    if (/\d+m/g.test(timeString))
      mins = parseInt(/\d+m/g?.exec(timeString)[0]?.replace("m", "")) * m;
    else mins = 0;
    if (/\d+h/g.test(timeString))
      hrs = parseInt(/\d+h/g?.exec(timeString)[0]?.replace("h", "")) * h;
    else hrs = 0;
    if (/\d+d/g.test(timeString))
      days = parseInt(/\d+d/g?.exec(timeString)[0]?.replace("d", "")) * d;
    else days = 0;
    if (/\d+w/g.test(timeString))
      weeks = parseInt(/\d+w/g?.exec(timeString)[0]?.replace("w", "")) * w;
    else weeks = 0;
    if (/\d+mo/g.test(timeString))
      Months = parseInt(/\d+mo/g?.exec(timeString)[0]?.replace("mo", "")) * mo;
    else Months = 0;
    if (/\d+y/g.test(timeString))
      years = parseInt(/\d+y/g?.exec(timeString)[0]?.replace("y", "")) * y;
    else years = 0;
    const output =
      parseInt(secs) +
      parseInt(mins) +
      parseInt(hrs) +
      parseInt(days) +
      parseInt(weeks) +
      parseInt(Months) +
      parseInt(years);
    return output;
  }
};
