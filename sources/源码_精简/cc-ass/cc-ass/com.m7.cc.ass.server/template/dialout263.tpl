context _accountId-predialout {
	_1[3458]XXXXXXXXX => {
      	goto _accountId-dialout,0${EXTEN},1;
 	}
 	
 	_0X. => {
 		goto _accountId-dialout,${EXTEN},1;
 	}

	_X. => {
		goto _accountId-dialout,_districtNo${EXTEN},1;
	}
}

context _accountId-dialout {
	_X. => {
		SIPAddHeader(X-DialoutOrNot: );
		CALLERID(num)=_didNum;
		_dialout;
	}
}