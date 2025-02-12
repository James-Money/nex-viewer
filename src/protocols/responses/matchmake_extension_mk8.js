const Stream = require('../../stream'); // eslint-disable-line no-unused-vars

class JoinMatchmakeSessionWithExtraParticipantsResponse {
	/**
	 * @param {Stream} stream NEX data stream
	 */
	constructor(stream) {
		this.sessionKey = stream.readNEXBuffer();
	}

	toJSON() {
		return {
			sessionKey: {
				__typeName: 'Buffer',
				__typeValue: this.sessionKey
			}
		};
	}
}

module.exports = {
	JoinMatchmakeSessionWithExtraParticipantsResponse
};
