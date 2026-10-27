context _account-_exten-validate{
    s => {
		_music;
		retry:
		__input="";
		loop:
		WaitExten(20);
    }
    _[0-9] => {
    	__input="${input}${EXTEN}";
    	if(${LEN(${input})} > _max){
    		Playback(sound/incorrect);
    		goto s,retry;
    	}
        goto s,loop;
    }

    * => {
      	goto ${FROM_CONTEXT},${FROM_DID},1;
    }
    
    # => {
    	if(${LEN(${input})} > _max || ${LEN(${input})} < _min){
    		Playback(sound/incorrect);
    		goto s,retry;
    	}
    	___data=${input};
    	_nextPeer;
    }

    i => {
        Playback(sound/bye);
        Hangup();
    }

    t => {
    	Playback(sound/timeout);
        Playback(sound/bye);
        Hangup();
    }
}