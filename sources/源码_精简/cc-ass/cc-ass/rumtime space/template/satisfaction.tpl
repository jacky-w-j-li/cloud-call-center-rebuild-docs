context _accountId-_exten-satisfaction {
    s => {
        RETRY_TIME = 0;
        input = "";
        
    loop:
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
        	_byemusic;
            Hangup();
        }
        _welmusic;
        WaitExten(5);
    }

    _[0-9] => {
    	goto _accountId-_exten-satisfaction-result, ${EXTEN}, 1;
    }
    
    i => {
    	if(${RETRY_TIME} == 0){
            goto s, loop;
        }
        if(${RETRY_TIME} > 3){
            _byemusic;
            Hangup();
        }
        _invalidmusic;
        goto s, loop;
    }

    t => {
        if(${RETRY_TIME} > 3){
            _byemusic;
            Hangup();
        }
        _timeoutmusic;
        goto s, loop;
    }

}

context _accountId-_exten-satisfaction-result {
    _X => {
    	_data=${exten};
        _endmusic;
        Wait(1);
        _nextPeer;
    }
}