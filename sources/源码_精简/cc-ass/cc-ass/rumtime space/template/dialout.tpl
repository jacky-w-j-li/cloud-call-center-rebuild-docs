context _accountId-predialout {
	__districtNoX. => {
		goto _accountId-dialout,${EXTEN:_dnLength},1;
	}
	
	_01[3458]XXXXXXXXX => {
		isLocal=0;
		Agi(agi://127.0.0.1:7891/AgiIsLocalNumber?calledNo=${EXTEN});
		if(${isLocal}==1)
			goto _accountId-dialout,${EXTEN:1},1;
		else
			goto _accountId-dialout,${EXTEN},1;
	}
	
	_1[3458]XXXXXXXXX => {
		isLocal=0;
		Agi(agi://127.0.0.1:7891/AgiIsLocalNumber?calledNo=${EXTEN});
		if(${isLocal}==1)
			goto _accountId-dialout,${EXTEN},1;
		else
			goto _accountId-dialout,0${EXTEN},1;
	}
	_110X. => {
		Hangup;
	}
	_X. => {
		goto _accountId-dialout,${EXTEN},1;
	}
}

context _accountId-dialout {
	_X. => {
		_outboundBlackList
		CALLERID(num)="_didNum";
		_dialout;
	}
}

context _accountId-transferout {
	_. => {
		CALLERID(num)="_didNum";
		goto transfer-gateway,${EXTEN},1;
	}
}