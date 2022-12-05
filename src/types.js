const Stream = require('./stream'); // eslint-disable-line no-unused-vars

class Structure {
	constructor() {
		this._parentTypesClasses = [];
		this._parentTypes = [];
		this._structureHeader = {
			version: 0,
			contentLength: 0
		};
	}

	toJSON() {
		const json = {
			__structureTypeName: this.constructor.name
		};

		for (const key in this) {
			if (Object.hasOwnProperty.call(this, key)) {
				json[key] = this[key];
			}
		}

		return json;
	}

	/**
	 *
	 * @param {Stream} stream NEX data stream NEX data stream
	 */
	extract(stream) {
		const parentTypesClasses = this._parentTypesClasses;

		for (const parentTypeClass of parentTypesClasses) {
			this._parentTypes.push(stream.readNEXStructure(parentTypeClass));
		}

		if (stream.connection.title.nex_version.major >= 3 && stream.connection.title.nex_version.minor >= 5) {
			this._structureHeader = {
				version: stream.readUInt8(),
				contentLength: stream.readUInt32LE()
			};
		}

		this.parse(stream);
	}
}

// This is empty
class Data extends Structure {
	// * This type contains nothing
	parse() { }

	toJSON() {
		return {};
	}
}

class AnyDataHolder {
	static typesHandlers = {};

	/**
	 *
	 * @param {string} name NEX type name
	 * @param {*} cls NEX type definition
	 */
	static addType(name, cls) {
		this.typesHandlers[name] = cls;
	}

	constructor() {
		this.typeName;
		this.length1;
		this.length2;
		this.data;
	}

	/**
	 *
	 * @param {Stream} stream NEX data stream
	 */
	extract(stream) {
		this.typeName = stream.readNEXString();
		this.length1 = stream.readUInt32LE();
		this.length2 = stream.readUInt32LE();

		const structure = AnyDataHolder.typesHandlers[this.typeName];

		if (structure) {
			this.data = stream.readNEXStructure(structure);
		} else {
			console.log(`Unknown AnyDataHolder type ${this.typeName}`);
			this.data = stream.readBytes(this.length2);
		}
	}

	toJSON() {
		const data = {
			typeName: {
				__typeName: 'String',
				__typeValue: this.typeName
			},
			length1: {
				__typeName: 'uint32',
				__typeValue: this.length1
			},
			length2: {
				__typeName: 'uint32',
				__typeValue: this.length2
			},
			objectData: {
				__typeName: this.typeName, // * The type of the data changes and is stored in the typeName
				__typeValue: this.data
			}
		};

		if (data.objectData.__typeValue instanceof Buffer) {
			data.objectData.__typeValue = data.objectData.__typeValue.toString('hex');
		}

		return data;
	}
}

class RVConnectionData extends Structure {
	/**
	 *
	 * @param {Stream} stream NEX data stream
	 */
	parse(stream) {
		this.stationUrl = stream.readNEXStationURL();
		this.specialProtocols = stream.readNEXList(stream.readUInt8);
		this.stationUrlSpecial = stream.readNEXStationURL();

		if (stream.connection.prudpVersion === 1) {
			this.currentUTCTime = stream.readUInt64LE(); // If prudpv1
		}
	}

	toJSON() {
		const data = {
			m_urlRegularProtocols: {
				__typeName: 'StationURL',
				__typeValue: this.stationUrl
			},
			m_lstSpecialProtocols: {
				__typeName: 'List<uint8>',
				__typeValue: this.specialProtocols
			},
			m_urlSpecialProtocols: {
				__typeName: 'StationURL',
				__typeValue: this.stationUrlSpecial
			}
		};

		if (this.currentUTCTime !== undefined) {
			data.m_currentUTCTime = {
				__typeName: 'DateTime',
				__typeValue: this.currentUTCTime
			}; // If prudpv1
		}

		return data;
	}
}

class StationURL {
	/**
	 *
	 * @param {string} string StationURL string
	 */
	constructor(string) {
		this._string = string;
		this.address;
		this.port;
		this.stream;
		this.sid;
		this.CID;
		this.PID;
		this.type;
		this.RVCID;
		this.natm;
		this.natf;
		this.upnp;
		this.pmp;
		this.probeinit;
		this.PRID;
		this.fastproberesponse;
		this.NodeID;

		// min length is "udp:/"
		if (string.length < 5) {
			return;
		}

		const data = string.split(':/');

		const scheme = data[0];
		let parameters = data[1];

		parameters = Object.fromEntries(parameters.split(';').map(parameter => parameter.split('=')));

		this.scheme = scheme;
		Object.assign(this, parameters);
	}

	toJSON() {
		return {
			url: {
				__typeName: 'String',
				__typeValue: this._string
			}
		};
	}
}

class DateTime { }

class ResultRange extends Structure {
	/**
	 *
	 * @param {Stream} stream NEX data stream
	 */
	parse(stream) {
		this.m_uiOffset = stream.readUInt32LE();
		this.m_uiSize = stream.readUInt32LE();
	}

	toJSON() {
		return {
			m_uiOffset: {
				__typeName: 'uint32',
				__typeValue: this.m_uiOffset
			},
			m_uiSize: {
				__typeName: 'uint32',
				__typeValue: this.m_uiSize
			}
		};
	}
}

class Result {
	/**
	 *
	 * @param {number} resultCode Result code
	 */
	constructor(resultCode) {
		this.resultCode = resultCode;
	}

	toJSON() {
		return {
			resultCode: {
				__typeName: 'uint32',
				__typeValue: this.resultCode
			}
		};
	}
}

class Variant {
	/**
	 *
	 *@param {Stream} stream NEX data stream
	 */
	constructor(stream) {
		this.type = stream.readUInt8();
		this.value = null; // * if type = 0, then value = null. Let null be default

		switch (this.type) {
		case 1:
			this.value = stream.readInt64LE();
			break;
		case 2:
			this.value = stream.readDoubleLE();
			break;
		case 3:
			this.value = stream.readBoolean();
			break;
		case 4:
			this.value = stream.readNEXString();
			break;
		case 5:
			this.value = stream.readNEXDateTime();
			break;
		case 6:
			this.value = stream.readUInt64LE();
			break;
		}
	}

	toJSON() {
		const data = {
			type: {
				__typeName: 'uint8',
				__typeValue: this.type
			},
			value: {
				__typeValue: this.value
			}
		};

		switch (this.type) {
		case 0:
			data.value.__typeName = 'No value';
			break;
		case 1:
			data.value.__typeName = 'sint64';
			break;
		case 2:
			data.value.__typeName = 'double';
			break;
		case 3:
			data.value.__typeName = 'boolean';
			break;
		case 4:
			data.value.__typeName = 'String';
			break;
		case 5:
			data.value.__typeName = 'DateTime';
			break;
		case 6:
			data.value.__typeName = 'uint64';
			break;
		}

		return data;
	}
}

module.exports = {
	Structure,
	Data,
	AnyDataHolder,
	RVConnectionData,
	StationURL,
	DateTime,
	ResultRange,
	Result,
	Variant
};