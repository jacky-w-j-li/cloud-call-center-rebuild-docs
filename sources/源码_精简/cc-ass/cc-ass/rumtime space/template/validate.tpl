context _accountId-_exten-validate{
    s => {
        input="";
    	_music;
      loop:
        WaitExten(_waittimeout);
    }

    _[0-9] => {
        input=${input}${EXTEN};
        if(${LEN(${input})} > _max){
                Playback(sound/incorrect);
                goto s,1;
        }
        goto s,loop;
    }

    _returnkey

    _endkey => {
        if(${LEN(${input})} > _max || ${LEN(${input})} < _min){
                Playback(sound/incorrect);
                goto s,1;
        }
        _data=${input};
        goto _accountId-_exten-transflow, ${input}, 1;
    }

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
