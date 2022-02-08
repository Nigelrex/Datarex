const fs = require("fs-extra");
const Database = require("better-sqlite3");
const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const fastify = require("fastify")();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();

module.exports = class Datarex extends Map {
  /**
   * @param {String} options.path path to database
   * @param {String} options.tableName Your tablename
   * @param {String} options.type client or server
   * @param {Object} options.settings Settings
   * @param {Boolean} options.settings.inMemory Set to true to use cache
   * @param {Boolean} options.settings.clearCache Set to true to clear cache in intervals
   * @param {Boolean} options.settings.loadKeys Set to true to load keys on startup
   * @param {Object} options.Intervals Intervals
   * @param {Boolean} options.Intervals.clearCacheInterval Set the interval to clear cache
   * @param {Boolean} options.Intervals.expireInterval Set the interval to expire a key
   *
   */
  constructor(options = {}) {
    super();
    // Options
    const defaultOptions = {
      path: "./Databases/index.sqlite",
      tableName: "json",
      server: {
        listen: "client", //default client
        type: "client",
        host: "127.0.0.1:433", //default 127.0.0.1
        port: 433, // default 433
        password: "Datarex", // default Datarex
      },
      Intervals: {
        expiryInterval: 1000, // defaults to 1000
        clearCacheInterval: 300000, // defaults to 300000
      },
      settings: {
        inMemory: true, //defaults to true
        clearCache: true, //defaults to true
        loadKeys: true, //defaults to true
      },
    };
    options = _.defaultsDeep(options, defaultOptions);
    this.options = options;
    this.path = options.path;
    this.server = options.server;
    if (typeof options.server.port !== "number") {
      if (typeof Parseint(options.server.port) !== "number")
        this.server.port = parseInt(options.server.port);
      else this.server.port = options.server.port;
    } else this.server.port = options.server.port;

    this.tableName = options.tableName;
    this.settings = options.settings;
    this.Intervals = options.Intervals;
    // Ensure dir
    fs.ensureDir(this.path.split(/\w+\.\w+/g.exec(this.path).pop())[0]);
    this.db = new Database(this.path);

    if (this.settings.loadKeys) {
      try {
        this.all().forEach((element) => {
          this.set(element.KEY, element.VALUE);
        });
      } catch (error) {}
    }
    setInterval(async () => {
      try {
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
              EXPIRY: row.EXPIRY,
            });
          } catch (error) {}
        }
        resp.forEach((element) => {
          if (element.EXPIRY <= moment().unix()) {
            this.removeExpiry(element.KEY);
          }
        });
      } catch (error) {}
    }, this.Intervals.expiryInterval);
    setInterval(() => {
      try {
        if (this.settings.inMemory) super.clear();
      } catch (error) {}
    }, this.Intervals.clearCacheInterval);

    if (this.server.type.toLowerCase() === "server") {
      fastify.listen(this.server.port);
      fastify.get("/Datarex", async (req, res) => {
        const key = req?.header("key");
        const value = req?.header("value");
        const type = req?.header("type");
        const tableName = req?.header("tableName");
        const password = req?.header("password");
        this.tableName = tableName ?? this.tableName;
        if (password !== this.server.password)
          return res.send({
            error: true,
            message: "password is incorrect",
          });
        if (type === undefined)
          return res.send({
            error: true,
            message: "ERROR: type is undefined",
          });
        if (key === undefined)
          return res.send({
            error: true,
            message: "key is undefined",
          });
        if (value === undefined)
          return res.send({
            error: true,
            message: "value is undefined",
          });
        return res.send({
          error: false,
          message: (await this[type](key, value)) ?? "Action done successfully",
        });
      });
    }
  }

  /**
   * @param {String} key
   * @param {Number} value
   */
  add(key, value) {
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("add", key, value);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);
    if (get === undefined) return;
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") parseInt(value);
    this.set(key, _.add(get, value));
  }

  /**
   * @returns All keys
   */
  all() {
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("all", null, null);
    this._ctine();
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
  async backUp(options = {}) {
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("backup", options, null);
    this._ctine();
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
          `Backup database names cannot include there special characters:`
        )} /\\?*":<>`);

    const dbName = options.path + options.name;

    await this.db.backup(dbName);
  }
  /**
   * Clears the cache
   */
  clearCache() {
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("clearCache", null, null);
    this._ctine();
    super.clear();
  }
  /**
   * closes the database
   */
  close() {
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("close", null, null);
    this._ctine();
    this.db.close();
  }
  /**
   *@param {String} key
   */
  delete(key) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("delete", key, null);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    if (this.settings.inMemory) super.delete(key);
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE KEY = (?)`).run(key);
  }

  /**
   * @param {String} KEY
   * @param {any} value
   */
  deleteAll() {
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("deleteAll", null, null);
    this._ctine();
    if (this.settings.inMemory) super.clear();
    this.db.prepare(`DELETE FROM ${this.tableName}`).run();
  }

  /**
   * @param {String} key
   * @param {Number} value
   * divides 2 numbers and set it
   */
  divide(key, value) {
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("divide", key, value);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);

    if (get === undefined) return;
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, _.divide(get, value));
  }

  /**
   * @param {String} key
   * @returns {any}
   */
  get(key) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("get", key, null);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    let target;
    let output;
    let unparsed;
    if (key && key.includes(".")) {
      unparsed = key.split(".");
      key = unparsed.shift();
      target = unparsed.join(".");
    }
    let fetched = this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE KEY = (?)`)
      .get(key);
    if (!fetched) return undefined;
    fetched = JSON.parse(fetched?.VALUE);
    if (typeof fetched === "object" && target) output = _.get(fetched, target);
    else output = fetched;
    if (this.settings.inMemory) {
      try {
        let val = JSON.parse(super.get(key));
        if (typeof val === "object" && target !== undefined)
          val = _.get(val, target);
        return val;
      } catch (error) {
        return undefined;
      }
    }
    try {
      return output;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * @param {String} key
   * @returns {Boolean}
   */
  has(key) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("has", key, null);
    this._ctine();
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
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("multiply", key, value);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);

    if (get === undefined) return;
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, _.multiply(get, value));
  }

  /**
   * @param {String} KEY
   * @param {any} value
   */
  push(key, value) {
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("push", key, value);
    this._ctine();
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
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("removeArrVal", key, value);
    this._ctine();
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
  removeExpiry(key) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("removeExpiry", key, null);
    let value = this.get(key);
    if (
      Boolean(
        this.db
          .prepare(`SELECT EXPIRY FROM ${this.tableName} WHERE KEY = (?)`)
          .get(key)
      )
    )
      this.db
        .prepare(
          `UPDATE ${this.tableName} SET KEY = (?), VALUE = (?), EXPIRY = (?) WHERE KEY = (?)`
        )
        .run(key, JSON.stringify(value), "null", key);
  }
  /**
   * @param {String} key
   */
  removeObjVal(key) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("removeObjVal", key, null);
    this._ctine();
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
  set(key, value, options = { EXPIRY: "null" }) {
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("set", key, value);
    this._ctine();
    if (typeof key === "number") key = key.toString();
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
        .prepare(
          `INSERT INTO ${this.tableName} (KEY , VALUE, EXPIRY ) VALUES( ? , ? , ? )`
        )
        .run(key, "{}", `${options.EXPIRY}`);
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
        `UPDATE ${this.tableName} SET KEY = (?), VALUE = (?), EXPIRY = (?) WHERE KEY = (?)`
      )
      .run(key, value, options.EXPIRY, key);

    if (this.settings.inMemory) super.set(key, value);
  }

  /**
   * @param {String} key
   * @param {String} timeString
   */
  setExpiry(key, timeString) {
    this._checkMissing(key, timeString);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("setExpiry", key, timeString);
    this._ctine();
    if (key && key.includes(".")) {
      let unparsed = key.split(".");
      key = unparsed.shift();
      target = unparsed.join(".");
    }
    const Nkey = key;
    key = this.get(key);
    console.log(key);
    if (!key) throw Error(`${key} does not exists`);
    const time = this._parseTime(timeString) ?? this._parseTime("10m");
    this.set(`${Nkey}.expiry`, key, {
      EXPIRY: `${time / 1000 + moment().unix()}`,
    });
  }

  /**
   * @param {Object} array
   *
   */
  setMany(array) {
    this._checkMissing(key, null);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("setmany", array, null);
    this._ctine();
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
    this._checkMissing(key, value);
    if (this.server.listen.toLowerCase() === "server")
      return this._Server("subtract", key, value);
    this._ctine();
    if (typeof key === "number") key = key.toString();
    const get = this.get(key);

    if (get === undefined) return;
    if (typeof get !== "number") throw Error(`${key} is not a number`);
    if (typeof value !== "number") throw Error(`${value} is not a number`);
    this.set(key, _.subtract(get, value));
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
        `CREATE TABLE IF NOT EXISTS ${this.tableName} (KEY TEXT, VALUE TEXT, EXPIRY TEXT)`
      )
      .run();
  }
  /**
   * @private
   */
  _checkMissing(key, value) {
    if (key === undefined) throw new TypeError(`${key} is not provided`);
    if (value === undefined) throw new TypeError(`${value} is not provided`);
  }

  async _Server(type, key, value) {
    if (this.server.listen.toLowerCase() === "client") return;

    return await fastify
      .post(`${this.server.host}/Datarex`, {
        headers: {
          type: type,
          key: key,
          value: value,
          tableName: this.tableName,
          password: this.server.password,
        },
      })
      .then(async (response, error) => {
        if (error) return error;
        if (response.json()) return await response.json();
      })
      .catch((error) => console.log(error));
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
