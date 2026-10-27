context _accountId-_exten-queue {
	_X. => {
		SIPAddHeader(X-AccountId: _accountId);
		_joinEmpty;
		StopMonitor();
		Set(__RECFILENAME=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}_${FROM_CID}_${FROM_DID}_${EXTEN}_${UNIQUEID});
		Set(__MONITOR_FILENAME=${RECFILENAME});
		BackGround(sound/queue);
		Queue(_exten,t,,,_waitTime);
		goto _accountId-_exten-queue-wait,s,1;
	}
	
	h => {
		_investigate;
	}
}

context _accountId-_exten-queue-wait {
    s => {
        BackGround(sound/busy);
        WaitExten(20);
    }

    1 => {
        _returnContext;
    }

    * => {
      goto ${FROM_CONTEXT},${FROM_DID},1;
    }

    i => {
        Playback(sound/bye);
        Hangup();
    }

    t => {
        Playback(sound/bye);
        Hangup();
    }
}
