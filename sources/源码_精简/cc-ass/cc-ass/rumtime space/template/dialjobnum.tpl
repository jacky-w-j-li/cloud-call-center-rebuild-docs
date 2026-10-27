context _accountId-_exten-dialjobnum {
	s => {
		_nextPeerNotExist;
	}
}

context _accountId-_exten-dialjobnum-agentbusy {
	s => {
		_nextPeerAgentBusy;
	}
}

context _accountId-_exten-dialjobnum-logoff {
	s => {
		_nextPeerLogoff;
	}
}