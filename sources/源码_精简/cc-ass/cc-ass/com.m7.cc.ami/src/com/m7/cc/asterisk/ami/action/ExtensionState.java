package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This command reports the extension state for the given extension. If the extension has
a hint, this will report the status of the device connected to the extension.

Parameters
Exten
[required] The name of the extension to check.
Context
[required] The name of the context that contains the extension.
ActionId
[optional] An action identifier that can be used to identify this manager transaction.
Privilege
call, all

Example
Action: ExtensionState
Exten: 200
Context: lab
ActionID: 54321

Response: Success
ActionID: 54321
Message: Extension Status
Exten: 200
Context: lab
Hint: SIP/testphone
Status: 0

Notes
The following are the possible extension states:
-2
Extension removed
-1
Extension hint not found
0
Idle
1
In use
2
Busy

 * @author Caif
 * @version 1.0, 2008-1-26
 */
public class ExtensionState extends AsteriskAction{
	
	private String exten;
	private String context;
	
	/**
	 * 
	 * @param exten extension name
	 * @param context the context where the extension hint the device
	 * @param actionID
	 */
	public ExtensionState(String exten, String context, String actionID) {
		super(AMIField.EXTENSION_STATE, actionID);
		this.context = context;
		this.exten = exten;
		this.addParameter(AMIField.EXTEN, exten);
		this.addParameter(AMIField.CONTEXT, context);
	}

	public String getContext() {
		return context;
	}

	public String getExten() {
		return exten;
	}

}
