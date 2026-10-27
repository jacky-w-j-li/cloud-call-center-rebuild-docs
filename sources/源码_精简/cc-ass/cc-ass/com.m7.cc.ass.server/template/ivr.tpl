context _accountId-_exten-ivr {
	_X. => {
		__FROM_CONTEXT="${CONTEXT}";
		goto _accountId-_exten-ivr-input,s,1;
	}
}

context _accountId-_exten-ivr-input {
	s => {
		INPUT_RETRY_TIMES=0;
		loop:
		_music;
		WaitExten(_timeout);
	}
_ivrkey
	i => {
		INPUT_RETRY_TIMES=${INPUT_RETRY_TIMES} + 1;
		if(${INPUT_RETRY_TIMES} >= _retry_time){
			Playback(sound/bye);
			Hangup();
		}
		Playback(sound/incorrect);
		goto s,loop;
	}
	
	t => {
		INPUT_RETRY_TIMES=${INPUT_RETRY_TIMES} + 1;
		if(${INPUT_RETRY_TIMES} >= _retry_time){
			Playback(sound/bye);
			Hangup();
		}
		Playback(sound/timeout);
		goto s,loop;
	}
}
