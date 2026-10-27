context _exten-line {
	s => {
		DPREFIX = _exten;
		CALLERID(num) = ${CallNo};
		Dial(SIP/${CalledNo}@_ip:_port);
	}
}