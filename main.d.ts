/// <reference types="typescript" />

// import Datarex from "./main.js";

export = Datarex;
declare class Datarex {
	public constructor(
		options?: DatarexOptions.ConstructorOptions,
	): DatarexOptions;

	/**
	 * Adds two numbers in the database
	 */
	public add(key: String, value: String): Datarex;

	/**
	 * Gets all the keys stored in the database table
	 */
	public all(): Datarex;

	/**
	 * Backup the database to the place you desire
	 */
	public backUp(
		options?: DatarexOptions.backUpOptions,
	): Datarex;
	/**
	 * Clears the cache
	 */
	public clearCache(): Datarex;
	/**
	 * Closes the database to stop any changes
	 */
	public close(): Datarex;
	/**
	 * Deletes a key from the database
	 */
	public delete(key: String): Datarex;
	/**
	 * Deletes all the keys, thus erasing the database
	 */
	public deleteAll(): Datarex;
	/**
	 * Divides a value in the database
	 */
	public divide(key: String, value: Number): Datarex;
	/***
	 *  Returns the key provided
	 */
	public get(key: String): Datarex;
	/**
	 * Check if the key exists in the database
	 */
	public has(key: String): Datarex;
	/**
	 *    Multiplies a value in the database
	 */
	public multiply(key: String, value: Number): Datarex;
	/**
	 *  Pushes a Object/String into the key
	 */
	public push(key: String, value: String): Datarex;
	/**
	 * Removes a Object/String/Array from the array from the key
	 */
	public removeArrVal(key: String, value: String): Datarex;
	/**
	 * Removes Expiry from the key
	 */
	public removeExpiry(key: String): Datarex;
	/**
	 * Removes a Object/String/Array from the Object from the key
	 */
	public removeObjVal(key: String): Datarex;
	/**
	 * Sets a value in the database
	 */
	public set(key: String, value: String): Datarex;
	/**
	 * Sets a expiry time for the key, so it gets deleted after that time
	 */
	public setExpiry(key: String, value: String): Datarex;
	/**
	 * Sets many keys and values in the database
	 */
	public setMany(array: Array): Datarex;
	/**
	 * Subtracts a value in the database
	 */
	public subtract(key: String, value: Number): Datarex;
	private _async(code: String): Datarex;
	private _ctine(): Datarex;
	private _checkMissing(
		key: String,
		value: String,
	): Datarex;
	private _Server(
		type: String,
		key?: any,
		value?: any,
	): Datarex;
	private _parseTime(timeString: String): Datarex;
}

declare namespace DatarexOptions {
	export interface ConstructorOptions {
		path?: String;
		tableName?: String;
		server?: {
			listen?: "client" | "server"; //default client
			type?: "client" | "server"; //default client
			host?: "127.0.0.1"; //default 127.0.0.1
			port?: 433; //default 433
			password: String;
		};
		Intervals?: {
			expiryInterval?: Number; // defaults to 1000
			clearCacheInterval?: Number; // defaults to 300000
		};
		settings?: {
			inMemory?: Boolean; //defaults to true
			clearCache?: Boolean; //defaults to true
			loadKeys?: Boolean; //defaults to true
		};
	}
	export interface backUpOptions {
		path?: String;
		name?: String;
	}
}
