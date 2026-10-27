context _accountId-_exten-superDialJobNum {
	s => {
		INPUT_RETRY_TIMES=0;
        	input="";
        	_music;
      		loop:
        	WaitExten(10);
    	}

    	_[1-9] => {
        	input=${input}${EXTEN};
        	if(${LEN(${input})} == 4){
			JOBNUM=${input};
        		Agi(agi://127.0.0.1:7891/AgiSuperDialin?pbx=${HOST}&exten=${JOBNUM});
			if(${JOBNUM_STATUS} == 1){
				_nextPeerNotExist;	
			}
			if(${JOBNUM_STATUS} == 2){
				_nextPeerLogoff;
			}
			if(${JOBNUM_STATUS} == 3){
				_nextPeerAgentBusy;
			}
        	}
        	goto s,loop;
    	}
	
	0 => {
		if("${input}a" == "a"){
			_nextPeerFrontOffice;
		}else{
			input=${input}${EXTEN};
                	if(${LEN(${input})} == 4){
                        	JOBNUM=${input};
                        	Agi(agi://127.0.0.1:7891/AgiSuperDialin?pbx=${HOST}&exten=${JOBNUM});
                        	if(${JOBNUM_STATUS} == 1){
                                	_nextPeerNotExist;
                        	}
                        	if(${JOBNUM_STATUS} == 2){
                                	_nextPeerLogoff;
                        	}
                        	if(${JOBNUM_STATUS} == 3){
                                	_nextPeerAgentBusy;
                        	}
                	}
                	goto s,loop;
		}
	}
	
	t => {
                INPUT_RETRY_TIMES=${INPUT_RETRY_TIMES} + 1;
                if(${INPUT_RETRY_TIMES} >= 3){
                        Playback(sound/bye);
                        Hangup();
                }
                Playback(sound/timeout);
                goto s,loop;
        }
	
	i => {
        	Playback(sound/incorrect);
        	goto s, 1;
    	}
}
