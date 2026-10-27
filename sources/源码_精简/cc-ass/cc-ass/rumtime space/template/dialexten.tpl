//this should be removed
context _accountId-_exten-validate {
    s => {
       input="";
       _music;
    loop:
       if (${LEN(${input})} >= _extlen){
			_data=${input};
			goto _accountId-_exten-transflow, ${input}, 1;
       }
       WaitExten(_waittimeout);
    }

    _X => {
		input=${input}${EXTEN};
		goto s, loop;
    }

    _returnkey

	i => {
	    Playback(sound/incorrect);	
	    goto s, 1;
	}

	t => {
	    Playback(sound/timeout);
	    _toPeerWhenTimeout;
	}
}


context _accountId-_exten-transflow {
    _. => {
        _nextPeer;
    }

}
