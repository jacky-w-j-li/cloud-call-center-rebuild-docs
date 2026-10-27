package com.dishui.notify;

import com.dishui.manager.command.JSONReader;
import com.dishui.manager.command.JSONWriter;
import com.dishui.manager.service.AppConfig;
import com.dishui.server.http.HttpProvider;

import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class NotifyService {
    private static Logger log = Logger.getLogger(NotifyService.class.getName());


    public static boolean notifySaleChance(String uid,String cid) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.saleChanceNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }



    public static boolean notifySaleChanceManager(List uids,String cid) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer = new JSONWriter();
        String _uids=writer.write(uids);
        url += ("?action=notify.saleChanceManagerNotify&data={\"uids\":" + _uids + ",\"cid\":\""+cid+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
}
