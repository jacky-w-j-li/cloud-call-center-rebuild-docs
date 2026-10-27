package com.dishui.manager.report.model;

import java.util.Hashtable;

/**
 * Created by chenguang on 11/12/15.
 */
public class MonitorAgent {
	public static final String NAME = "MonitorAccessId";

	private String account;
	private String _id;

    private int claim = 0; //领取数量
	private int dealing = 0; //正在聊天
	private boolean autoClaim = true; //自动领取状态
	private boolean mailAutoClaim = false; // 邮件自动领取状态

	public MonitorAgent(String account, String id) {
        this.account = account;
        this._id =  id;
	}

    public void accessSession(){
        claim++;
        dealing++;
    }

    public void redirectFromMeSession(){
        if(dealing >0){
            dealing--;
        }
    }
    public void redirectToMeSession(){
        dealing++;
    }

    public void closeSession(){
        if(dealing >0){
            dealing--;
        }
    }

    public void autoClaimStatus(boolean status){
        autoClaim = status;
    }

    public void setClaim(int claim) {
        this.claim = claim;
    }

    public void setDealing(int dealing) {
        this.dealing = dealing;
    }

    public void setAutoClaim(boolean autoClaim) {
        this.autoClaim = autoClaim;
    }
	public void setMailAutoClaim(boolean mailAutoClaim) {
		this.mailAutoClaim = mailAutoClaim;
	}
    public Hashtable<String, Object> getEventData(){
        Hashtable<String, Object> eventData = new Hashtable<String, Object>();
        eventData.put("im_monitor_type","agent");
        eventData.put("_id",_id);
        eventData.put("claim",claim);
        eventData.put("dealing",dealing);
        eventData.put("autoClaim",autoClaim);
		eventData.put("mailAutoClaim", mailAutoClaim);//邮件自动领取
        return eventData;
    }

    public String getId() {
        return _id;
    }
}
