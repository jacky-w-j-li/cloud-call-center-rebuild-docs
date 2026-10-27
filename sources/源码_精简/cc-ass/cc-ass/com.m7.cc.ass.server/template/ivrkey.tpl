	_key => \{
		if(\$\["\$\{FROM_IVR\}" = ""\])
			__FROM_IVR="_key";
		else __FROM_IVR="\$\{FROM_IVR\}-_key";
		Set(__IVRKEY=\$\{FROM_IVR\});
		_nextPeer;
	}
