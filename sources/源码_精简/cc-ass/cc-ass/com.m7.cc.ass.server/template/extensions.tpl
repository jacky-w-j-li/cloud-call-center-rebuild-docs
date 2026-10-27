context _accountId {
	_X. => {
		__FROM_CID=${CALLERID(num)};
    	__FROM_DID=${EXTEN};
    	__ACCOUNT=_accountId;
    	__FROM_CONTEXT="${CONTEXT}";
    	SIPAddHeader(X-AccountId: _accountId);
		SIPAddHeader(X-DialoutOrNot: -local);
    	Answer;
    	goto _accountId-route,${EXTEN},1;
	}
}

context _accountId-dial {
	_X. => {
		StopMonitor();
		Set(__RECFILENAME=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}_${CALLERID(num)}_${EXTEN}_${UNIQUEID});
		Monitor(wav,${RECFILENAME},b);

		goto _accountId-call,${EXTEN},1;
	}
}

context _accountId-call {
	_X. => {
		SPYGROUP="SIP/${EXTEN}";
		Dial(SIP/${EXTEN});
	}
	_9X. => {
		goto _accountId-predialout,${EXTEN:1},1;
	}
}

context _accountId-dialin {
	_X. => {
		MusicOnHold();
	}
}

context _accountId-investigate {
     s => {
            RETRY_TIME = 0;
            PLAY_TIME = 0;
        loop:
           	if(${PLAY_TIME} > 3){
            	Playback(sound/bye);
            	Hangup();
       	 	}
            _investigateMusic;
            PLAY_TIME = ${PLAY_TIME} + 1;
			goto s,loop;
    }

    _[0-9] => {
		goto _accountId-investigate-result, ${EXTEN}, 1;
    }
    
    # => {
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
            Playback(sound/bye);
            Hangup();
        }
        Playback(sound/incorrect);
        goto s, loop;
    }
    
    * => {
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
            Playback(sound/bye);
            Hangup();
        }
        Playback(sound/incorrect);
        goto s, loop;
    }
}

context _accountId-investigate-result {
	_X => {
		Playback(sound/thx);
		Hangup();
	}
}