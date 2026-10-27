context _accountId-prexfer {
	_1[358]XXXXXXXXX => {
      	goto _accountId-xfer,0${EXTEN},1;
 	}
 	
 	_0X. => {
 		goto _accountId-xfer,${EXTEN},1;
 	}

	_X. => {
		goto _accountId-xfer,_districtNo${EXTEN},1;
	}
}

context _accountId-xfer {
	_X. => {
		CALLERID(num)=_didNum;
		_xfer;
	}
}