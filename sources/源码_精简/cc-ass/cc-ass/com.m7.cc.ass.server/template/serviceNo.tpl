context _serviceNo {
	_serviceNo => {
		__FROM_CID=${CALLERID(num)};
		__FROM_DID=${EXTEN};
		__FROM_CONTEXT="${CONTEXT}";
		__ACCOUNT=_accountId;
		SIPAddHeader(X-AccountId: _accountId);
		SIPAddHeader(X-DialoutOrNot: -local);
		Answer;
_callroute
		loop:
		_welcomeMusic;
		_nextPeer;
	}
}

context _serviceNo-ivrlogin {
	s => {
		BackGround(sound/ivrlogin);
		WaitExten(20);
	}
	
	1 => {
		goto _serviceNo-ivrlogined,s,1;
	}
	
	2 => {
		goto _serviceNo-ivrlogout,s,1;
	}
	
	3 => {
		goto _serviceNo,_serviceNo,loop;
	}
	
	t => {
    	Playback(sound/timeout);
        Playback(sound/bye);
        Hangup();
    }
    
	i => {
        BackGround(sound/incorrect);
		goto s,1;
    }
}

context _serviceNo-ivrlogined {
	s => {
		Playback(sound/ivrloginsuccess);
		Hangup;
	}
}

context _serviceNo-ivrlogout {
	s => {
		Playback(sound/ivrlogoutsuccess);
		Hangup;
	}
}