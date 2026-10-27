context _accountId-_exten-queue {
	_X. => {
		if (${QUEUE_MEMBER_COUNT(_exten)} == 0){
			Wait(1);
			goto _accountId-_exten-queue-empty-transfer, s, 1;
		}
		_checkAssignable
	    empty-loop:			
		StopMonitor();
		Set(RECFILENAME=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}__accountId__exten_${FROM_CID}_${FROM_DID}_${EXTEN}_${UNIQUEID});
		Set(MONITOR_FILENAME=${RECFILENAME});
		_music
		Queue(_exten,t,,,_waitTime);
		_toPeerWhenWaitTimeout;
	}
	
	h => {
		goto _accountId-_exten-queue-hangup-transfer, s, 1;
	}
}

context _accountId-_exten-queue-hangup-transfer {
	s => {
		RETRY_TIME=0;
		Wait(3);
		Hangup;
	}
}

context _accountId-_exten-queue-empty-transfer {
	s => {
		_toPeerWhenQueueEmpty;
	}	
}

context _accountId-_exten-queue-wait-transfer{
	_X => {
		_toPeerWhenWait;
	}
}