context _accountId-predialout {
	__districtNoX. => {
		goto _accountId-dialout,${EXTEN:_dnLength},1;
	}
	
	_01[3458]XXXXXXXXX => {
		System(/bin/grep ${EXTEN:1:7} /etc/asterisk/lcoal);
		if(${SYSTEMSTATUS} == SUCCESS)
			goto _accountId-dialout,${EXTEN:1},1;
		goto _accountId-dialout,${EXTEN},1;
	}
	
	_1[3458]XXXXXXXXX => {
		System(/bin/grep ${EXTEN:0:7} /etc/asterisk/local);
		if(${SYSTEMSTATUS} == SUCCESS)
			goto _accountId-dialout,${EXTEN},1;
		goto _accountId-dialout,0${EXTEN},1;
	}
	
	_X. => {
		goto _accountId-dialout,${EXTEN},1;
	}
}

context _accountId-dialout {
	_X. => {
		SIPAddHeader(X-AccountId: _accountId);
		SIPAddHeader(X-DialoutOrNot: );
		CALLERID(num)=_didNum;
		_dialout;
	}
}