	_key => \{
		KEY_OF_IVR=\$\{EXTEN\};
		if("\$\{FROM_IVR\}foo" == "foo")
			FROM_IVR=\$\{EXTEN\};
		else 
			FROM_IVR="\$\{FROM_IVR\}-_key";	
		Set(__IVRKEY=\$\{FROM_IVR\});
		_nextPeer;
	}
