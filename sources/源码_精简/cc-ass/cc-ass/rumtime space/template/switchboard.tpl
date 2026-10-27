context _accountId-_exten-switch-board {
	s => {
		_music	
        input="";
      loop:
        WaitExten(10);
    }

    0 => {
    	_queue;
    }

    _[1-9] => {
        input=${input}${EXTEN};
        goto s,loop;
    }

    * => {
    	input="";
    	goto s,loop;
    }

    # => {
        JOBNUM=${input};
        goto _accountId-dial,${JOBNUM},1;
    }

    i => {
        Playback(sound/incorrect);
        input="";
        goto s, 1;
    }

    t => {
        Playback(sound/timeout);
        input="";
        goto s,1;
    }
}