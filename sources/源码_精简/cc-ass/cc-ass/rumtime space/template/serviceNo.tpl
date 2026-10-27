context _serviceNo {
	_X. => {
		Wait(0.5);
		FROM_CID=${CALLERID(num)};
		FROM_DID=${EXTEN};
		FROM_CONTEXT="${CONTEXT}";
		ACCOUNT=_accountId;
		_typeOfServiceNo;
		Wait(0.5);
		Agi(agi://127.0.0.1:7891/gaicalllimit?pbx=${HOST}&servicepeer=_serviceNo);
		Answer;
		Wait(1);
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
		goto _serviceNo-jobnumconfirm,s,1;	
	}
	
	2 => {
		goto _serviceNo-jobnumconfirmout,s,1;
	}
	
	3 => {
		goto _serviceNo,_serviceNo,loop;
	}

	4 => {
		goto ivr-flow-checking,s,1;
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

context _serviceNo-jobnumconfirm {
	s => {
		input="";
		BackGround(sound/importjobnum);
		
		loop:
		WaitExten(20);
	}
	
	_[0-9] => {
		input=${input}${EXTEN};
		if(${LEN(${input})} > 10){
			Playback(sound/jobnumincorrect);
			goto s,1;
		}
		goto s,loop;
	}
	
	# => {
		if(${LEN(${input})} > 10 || ${LEN(${input})} < 1){
			Playback(sound/jobnumincorrect);
			goto s,1;
		}
		goto _serviceNo-ivrlogined,s,1;
	}
	
	* => {
		Playback(sound/jobnumincorrect);
		goto s,1;
	}
}

context _serviceNo-jobnumconfirmout {
	s => {
		input="";
		BackGround(sound/importjobnum);
		
		loop:
		WaitExten(20);
	}
	
	_[0-9] => {
		input=${input}${EXTEN};
		if(${LEN(${input})} > 10){
			Playback(sound/jobnumincorrect);
			goto s,1;
		}
		goto s,loop;
	}
	
	# => {
		if(${LEN(${input})} > 10 || ${LEN(${input})} < 1){
			Playback(sound/jobnumincorrect);
			goto s,1;
		}
		goto _serviceNo-ivrlogout,s,1;
	}
	
	* => {
		Playback(sound/jobnumincorrect);
		goto s,1;
	}
}

context _serviceNo-ivrlogined {
	s => {
		ivrloginsucceed=0;
		Agi(agi://127.0.0.1:7891/AgiProcessIvrLogin?pbx=${HOST}&exten=${input});
		if(${ivrloginsucceed} == 1){
			Playback(sound/ivrloginsuccess);
			Wait(1);
			Hangup;
		} else if(${ivrloginsucceed} == 500){
			Playback(sound/beyond);
			goto _serviceNo-ivrlogin,s,1;		
		} else if(${ivrloginsucceed} == 501){
			Playback(sound/jobnumincorrect);
			goto _serviceNo-ivrlogin,s,1;
		} else {
			Playback(sound/failed);
			goto _serviceNo-ivrlogin,s,1;
		}
		
	}
}

context _serviceNo-ivrlogout {
	s => {
		ivrlogoutsucceed=0;
		Agi(agi://127.0.0.1:7891/AgiProcessIvrLogout?pbx=${HOST}&exten=${input});
		if(${ivrlogoutsucceed} == 1){
			Playback(sound/ivrlogoutsuccess);
			Wait(1);
			Hangup;
		} else if(${ivrlogoutsucceed} == 501){
			Playback(sound/jobnumincorrect);
			goto _serviceNo-ivrlogin,s,1;
		} else{
			Playback(sound/failed);
			goto _serviceNo-ivrlogin,s,1;
		}
	}
}