package com.dishui.service.manager;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.http.HttpProvider;
import com.dishui.model.NotificationVO;
import com.dishui.utils.AppConfig;
import com.dishui.utils.json.JSONReader;

public class WebchatWeixinRemind implements NotificationService {
    private static Logger log = Logger.getLogger(NotificationService.class.getName());
    private static final WebchatWeixinRemind webchatWeixinRemind=new WebchatWeixinRemind();
    private WebchatWeixinRemind(){
    	
    }
    public static WebchatWeixinRemind getInstance(){
		return webchatWeixinRemind;
    }


	@Override
	public boolean process(NotificationVO vo) {
		// TODO Auto-generated method stub
		//走service是,不用校验session,属于内部通讯
		String url=AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=webchat.weixinRemindMsg&data={\"_id\":\"" + vo.getId() + "\"}");
		   try {
	            String result = HttpProvider.sendGet(url);
	            JSONReader reader = new JSONReader();
	            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
	            if (resultObj.get("success") == null && !((Boolean) resultObj.get("success"))) {
	                log.warning(resultObj.get("message").toString());
					return false;
	            } else {
	            	return true;
				}
	        } catch (Exception e) {
	            log.log(Level.WARNING, "", e);
			   	return false;
	        }

	}

}
