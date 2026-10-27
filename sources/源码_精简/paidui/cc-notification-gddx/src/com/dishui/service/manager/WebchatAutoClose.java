package com.dishui.service.manager;

import com.dishui.utils.AppConfig;
import com.dishui.http.HttpProvider;
import com.dishui.model.NotificationVO;
import com.dishui.utils.json.JSONReader;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zengyx on 16/10/9.
 */
public class WebchatAutoClose implements NotificationService {

    private static Logger log = Logger.getLogger(NotificationService.class.getName());

    private static final WebchatAutoClose webchatAutoClose =new WebchatAutoClose();
    private WebchatAutoClose(){}

    public static WebchatAutoClose getInstance(){
        return webchatAutoClose;
    }


    public boolean process(NotificationVO notificationVO){
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=webchat.autoCloseWebchatSession&data={\"_id\":\"" + notificationVO.getId() + "\"}");

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
