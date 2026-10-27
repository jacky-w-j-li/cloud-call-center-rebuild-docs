context {serviceNo}-webcall {
	_X. => {
		__FROM_CID=${__CALLERID};
    	__FROM_DID={serviceNo};
    	__ACCOUNT={accountId};
    	Answer;
    	{nextPeer};
    }
}
