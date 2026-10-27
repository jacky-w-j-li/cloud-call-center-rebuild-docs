context _accountId {
	_X. => {
		FROM_CID=${CALLERID(num)};
		FROM_DID=${EXTEN};
		ACCOUNT=_accountId;
		dialNum=${FROM_DID};
		Agi(agi://127.0.0.1:7891/AgiFormatDialoutNumber?pbx=${HOST}&accountid=${ACCOUNT}&dialnum=${dialNum});
		Answer;
		goto _accountId-route,${dialNum},1;
	}
	0000 => {
		ACCOUNT=_accountId;
		goto sip-manage,s,1;
	}
}

context _accountId-dial {
	_X. => {
		StopMonitor();
		Set(RECFILENAME=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}__accountId_${CALLERID(num)}_${EXTEN}_${UNIQUEID});
		Monitor(wav,${RECFILENAME},b);
		goto _accountId-call,${EXTEN},1;
	}
}

context _accountId-call {
	_X. => {
		SPYGROUP="SIP/${EXTEN}";
		Dial(SIP/${EXTEN},,t);
	}
	_9X. => {
		MusicOnHold();
	}
}

context _accountId-balance {
    _. => {
		Playback(sound/balance);
		Hangup();
    }
}

context _accountId-dialin {
    _X. => {
		CALLERID(name)=${EXTEN};
		JOBNUM=${EXTEN};
        Agi(agi://127.0.0.1:7891/AgiDialin?pbx=${HOST}&exten=${EXTEN});
        Hangup();
    }
}

context _accountId-investigate {
    s => {
        RETRY_TIME = 0;
    loop:
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
            Hangup();
        }
        _investigateMusic;
	WaitExten(5);
        goto s,loop;
    }

    _[0-9] => {
    	goto _accountId-investigate-result, ${EXTEN}, 1;
    }
    
    i => {
    	if(${RETRY_TIME} == 0){
            goto s, loop;
        }
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
            Playback(sound/bye);
            Hangup();
        }
        Playback(sound/incorrect);
        goto s, loop;
    }

    t => {
        RETRY_TIME=${RETRY_TIME} + 1;
        if(${RETRY_TIME} > 3){
            Playback(sound/bye);
            Hangup();
        }
        Playback(sound/timeout);
        goto s, loop;
    }

}

context _accountId-investigate-result {
    _X => {
        Playback(sound/thx);
        Wait(1);
        Hangup();
    }
}