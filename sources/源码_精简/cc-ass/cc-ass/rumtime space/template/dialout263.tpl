context _accountId-predialout {
	_1[3458]XXXXXXXXX => {
      	goto _accountId-dialout,0${EXTEN},1;
 	}
 	
 	_0X. => {
 		goto _accountId-dialout,${EXTEN},1;
 	}
	
	_[48]00X. => {
		goto _accountId-dialout,${EXTEN},1;
	}
	
	_X. => {
		goto _accountId-dialout,_districtNo${EXTEN},1;
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