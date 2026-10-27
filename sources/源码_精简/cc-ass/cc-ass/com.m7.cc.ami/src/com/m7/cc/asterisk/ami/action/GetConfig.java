package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * Retrieves the data from an Asterisk configuration file.
 * 
 * Parameters:
 * 
 * Filename
 * [required]Name of the configuration file to retrieve.
 * 
 * ActionID
 * [optional] An identifier that can be used to identify the response to this action.
 * 
 * Privilege
 * config, all
 * 
 * Example:
 * 
 * Action: GetConfig
 * Filename: musiconhold.conf
 * ActionID: 09235012
 * 
 * Response: Success
 * ActionID: 09235012
 * Category-000000: default
 * Line-000000-000000: mode=files
 * Line-000000-000001: directory=/var/lib/asterisk/moh
 * Line-000000-000002: random=yes
 * 
 * @author caizhibin
 *
 */
public class GetConfig extends AsteriskAction{
	private String fileName;
	public GetConfig(String fileName, String actionID) {
		super(AMIField.GET_CONFIG, actionID);
		this.fileName = fileName;
		this.addParameter(AMIField.FILENAME, fileName);
	}
	public String getFileName() {
		return fileName;
	}
	public void setFileName(String fileName) {
		this.fileName = fileName;
		this.addParameter(AMIField.FILENAME, fileName);
	}
}
