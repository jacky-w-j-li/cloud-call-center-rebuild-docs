context _accountId-_exten-ivr {
	_X. => {
		FROM_CONTEXT="${CONTEXT}";
		if("${FROM_IVR}a" == "a")
            FROM_IVR="";
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
