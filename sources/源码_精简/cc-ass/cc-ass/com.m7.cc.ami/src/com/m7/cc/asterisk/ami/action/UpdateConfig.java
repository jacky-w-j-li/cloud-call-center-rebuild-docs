package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * Dynamically updates an Asterisk configuration file.
 * 
 * Parameters:
 * 
 * SrcFilename
 * [required] The filename of the configuration file from which to read the current
 * information.
 * 
 * DstFilename
 * [required] The filename of the configuration file to be written.
 * 
 * Reload
 * [optional] Specifies whether or not a reload should take place after the configuration
 * update, or the name of a specific module that should be reloaded.
 * 
 * Action-XXXXXX
 * [required] An action to take. Can be one of NewCat, RenameCat, DelCat, Update,
 * Delete, or Append.
 * 
 * Cat-XXXXXX
 * [required] The name of the category to operate on.
 * 
 * Var-XXXXXX
 * [optional] The name of the variable to operate on.
 * 
 * Value-XXXXXX
 * [optional] The value of the variable to operate on.
 * 
 * Match-XXXXXX
 * [optional] If set, an extra parameter that must be matched on the line.
 * 
 * ActionID
 * [optional] An identifier that can be used to identify the response to this action.
 * 
 * Privilege
 * config, all
 * 
 * Example
 * 
 * Action: UpdateConfig
 * SrcFilename: sip.conf
 * DstFilename: test.conf
 * Action-000000: update
 * Cat-000000: linksys
 * Var-000000: mailbox
 * Value-000000: 101@lab
 * Response: Success
 * 
 * Notes:
 * 
 * Note that the first set of parameters should be numbered 000000, the second 000001,
 * and so on. This allows you to update many different configuration values at the same
 * time. It should also be noted that the Asterisk GUI uses this its primary mechanism for
 * updating the configuration of Asterisk.
 * 
 * @author caizhibin
 *
 */
public class UpdateConfig extends AsteriskAction{

	public static final String NewCat = "NewCat";
	public static final String RenameCat = "RenameCat";
	public static final String DelCat = "DelCat";
	public static final String Update = "Update";
	public static final String Delete = "Delete";
	public static final String Append = "Append";
	
	private String SrcFilename;
	private String DstFilename;
	private int actionNum = 0;
	private boolean reload;//yes, no
	public UpdateConfig(boolean reload, String actionID) {
		super(AMIField.UPDATE_CONFIG, actionID);
		this.reload = reload;
		this.addParameter(AMIField.RELOAD, reload?"yes":"no");
	}

	public void newCat(String cat){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, NewCat);
		this.addParameter("Cat-"+num, cat);	
	}
	
	public void renameCat(String cat){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, RenameCat);
		this.addParameter("Cat-"+num, cat);	
	}
	
	public void delCat(String cat){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, DelCat);
		this.addParameter("Cat-"+num, cat);	
	}
	
	public void update(String cat, String var, String value){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, Update);
		this.addParameter("Cat-"+num, cat);
		this.addParameter("Var-"+num, var);
		this.addParameter("Value-"+num, value);
	}
	
	public void update(String cat, String var, String value, String match){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, Update);
		this.addParameter("Cat-"+num, cat);
		this.addParameter("Var-"+num, var);
		this.addParameter("Value-"+num, value);
		if(match != null)
			this.addParameter("Match-"+num, match);
	}
	
	public void delete(String cat, String var, String match){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, Delete);
		this.addParameter("Cat-"+num, cat);
		this.addParameter("Var-"+num, var);
		if(match != null)
			this.addParameter("Match-"+num, match);
	}
	
	public void append(String cat, String var, String value){
		String num = getNextActionNumber();
		this.addParameter("Action-"+num, Append);
		this.addParameter("Cat-"+num, cat);
		this.addParameter("Var-"+num, var);
		this.addParameter("Value-"+num, value);
	}
	
	private String getNextActionNumber(){
		String num = actionNum+"";
		if(actionNum <10)
			num = "00000"+actionNum;
		else if(actionNum < 100)
			num = "0000"+actionNum;
		else if (actionNum < 1000)
			num = "000"+actionNum;
		else if (actionNum < 10000)
			num = "00"+actionNum;
		else if (actionNum < 100000)
			num = "0"+actionNum;
		actionNum++;
		return num;
	}

	public String getSrcFilename() {
		return SrcFilename;
	}

	public void setSrcFilename(String srcFilename) {
		SrcFilename = srcFilename;
		this.addParameter(AMIField.SrcFilename, srcFilename);
	}

	public String getDstFilename() {
		return DstFilename;
	}

	public void setDstFilename(String dstFilename) {
		DstFilename = dstFilename;
		this.addParameter(AMIField.DstFilename, dstFilename);
	}

	public boolean isReload() {
		return reload;
	}

	public void setReload(boolean reload) {
		this.reload = reload;
		this.addParameter(AMIField.RELOAD, reload?"yes":"no");
	}
	
}
