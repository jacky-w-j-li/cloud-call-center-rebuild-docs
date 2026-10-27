context _accountId-prexfer {
	__districtNoX. => {
		goto _accountId-xfer,${EXTEN:_dnLength},1;
	}
	
	_01[358]XXXXXXXXX => {
		System(/bin/grep ${EXTEN:1:7} /etc/asterisk/lcoal);
		if(${SYSTEMSTATUS} == SUCCESS)
			goto _accountId-xfer,${EXTEN:1},1;
		goto _accountId-xfer,${EXTEN},1;
	}
	
	_1[358]XXXXXXXXX => {
		System(/bin/grep ${EXTEN:0:7} /etc/asterisk/local);
		if(${SYSTEMSTATUS} == SUCCESS)
			goto _accountId-xfer,${EXTEN},1;
		goto _accountId-xfer,0${EXTEN},1;
	}
	
	_X. => {
		goto _accountId-xfer,${EXTEN},1;
	}
}

context _accountId-xfer {
	_X. => {
		CALLERID(num)=_didNum;
		_xfer;
	}
}