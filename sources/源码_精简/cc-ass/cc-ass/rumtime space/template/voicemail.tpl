context _accountId-_exten-voicemail {
	s => {
		Answer;
		_welmusic;
		loop:
		Set(RECFILENAME=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}__accountId_${CALLERID(num)}_${EXTEN}_${UNIQUEID});
		Playback(sound/vmstart);
		Playback(sound/du);
		goto _accountId-_exten-voicemail-start,s,1;
	}
}

context _accountId-_exten-voicemail-start {
	s => {
		Set(RECORD_FILENAME="${RECFILENAME}-vm");
		Record(${RECORD_FILENAME}.wav);
		ivrloop:
		BackGround(sound/vmend);
		WaitExten(20);
	}
	
	* => {
		System(/bin/rm /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav);
		goto ${FROM_CONTEXT},${FROM_DID},1;
    }
	
	1 => {
		goto _accountId-_exten-voicemail-end,s,1;
	}
	
	2 => {
		System(/bin/rm /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav);
		goto _accountId-_exten-voicemail,s,loop;
	}
	
	i => {
        BackGround(sound/incorrect);
		goto s,ivrloop;
    }
    
    h => {
    	System(/bin/rm /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav);
    }
    
    t => {
    	System(/bin/rm /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav);
    	Playback(sound/timeout);
        Playback(sound/bye);
        Hangup();
    }
}

context _accountId-_exten-voicemail-end {
	s => {
		System(/bin/cp /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav /var/spool/asterisk/_pbx/monitor/${RECORD_FILENAME}.wav);
		Playback(sound/recordsucess);
		System(/bin/rm /var/lib/asterisk/sounds/${RECORD_FILENAME}.wav);
		_toPeer;
	}
}