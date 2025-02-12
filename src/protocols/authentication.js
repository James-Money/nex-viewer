const Packet = require('../packet'); // eslint-disable-line no-unused-vars
const PacketV0 = require('../packetv0'); // eslint-disable-line no-unused-vars
const PacketV1 = require('../packetv1'); // eslint-disable-line no-unused-vars
const RMCMessage = require('../rmc'); // eslint-disable-line no-unused-vars
const Stream = require('../stream');

require('./types/authentication');

const Requests = require('./requests/authentication');
const Responses = require('./responses/authentication');

class Authentication {
	static ProtocolID = 0xA;

	static ProtocolName = 'Authentication';

	static Methods = {
		Login: 0x1,
		LoginEx: 0x2,
		RequestTicket: 0x3,
		GetPID: 0x4,
		GetName: 0x5,
		LoginWithContext: 0x6
	};

	static MethodNames = Object.entries(Authentication.Methods).reduce((namesObject, entry) => {
		const [key, value] = entry;
		namesObject[value] = key;
		return namesObject;
	}, {});

	static Handlers = {
		0x1: Authentication.Login,
		0x2: Authentication.LoginEx,
		0x3: Authentication.RequestTicket
	};

	/**
	 *
	 * @param {(Packet|PacketV0|PacketV1)} packet PRUDP packet
	 */
	static handlePacket(packet) {
		const methodId = packet.rmcMessage.methodId;

		const handler = Authentication.Handlers[methodId];

		if (!handler) {
			console.log(`Unknown Authentication method ID ${methodId} (0x${methodId?.toString(16)}) (${Authentication.MethodNames[methodId]})`);
			return;
		}

		const { rmcMessage } = packet;
		const stream = new Stream(rmcMessage.body, packet.connection);

		packet.rmcData = {
			body: handler(rmcMessage, stream)
		};
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static Login(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.LoginRequest(stream);
		} else {
			return new Responses.LoginResponse(stream);
		}
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static LoginEx(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.LoginExRequest(stream);
		} else {
			return new Responses.LoginExResponse(stream);
		}
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static RequestTicket(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.RequestTicketRequest(stream);
		} else {
			return new Responses.RequestTicketResponse(stream);
		}
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static GetPID(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.GetPIDRequest(stream);
		} else {
			return new Responses.GetPIDResponse(stream);
		}
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static GetName(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.GetNameRequest(stream);
		} else {
			return new Responses.GetNameResponse(stream);
		}
	}

	/**
	 *
	 * @param {RMCMessage} rmcMessage NEX RMC message
	 * @param {Stream} stream NEX data stream
	 * @returns {object} Parsed RMC body
	 */
	static LoginWithContext(rmcMessage, stream) {
		if (rmcMessage.isRequest()) {
			return new Requests.LoginWithContextRequest(stream);
		} else {
			return new Responses.LoginWithContextResponse(stream);
		}
	}
}


module.exports = Authentication;