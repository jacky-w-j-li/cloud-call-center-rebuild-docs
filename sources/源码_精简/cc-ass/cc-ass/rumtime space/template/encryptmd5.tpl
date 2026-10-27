context _accountId-_exten-encryptmd5 {
	s => {
		Agi(agi://127.0.0.1:7891/agiencryptmd5?pbx=${HOST}&servicepeer=_exten);
		_nextPeer;
	}
}