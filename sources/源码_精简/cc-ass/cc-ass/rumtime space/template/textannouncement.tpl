context _accountId-_exten-textannouncement {
	s => {
		Agi(agi://127.0.0.1:7891/agittszh?pbx=${HOST}&servicepeer=_exten);
		_nextPeer;
	}
}