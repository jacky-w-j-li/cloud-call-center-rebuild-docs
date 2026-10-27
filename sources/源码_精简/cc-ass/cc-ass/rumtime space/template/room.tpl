context _accountId-_exten-room {
	s => {
		_roomPassword
		Playback(sound/conferencesuccess);
		MeetMe(_roomNumber,1dMsT);
		Hangup();
	}
}